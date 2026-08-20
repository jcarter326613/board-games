import {
    deckTypeDetailSchema,
    deckTypeListResponseSchema,
    deckTypeSchema,
    type DeckType,
    type DeckTypeDetail,
    type DeckTypeListResponse,
} from "@board-games/contracts"
import { db, schema } from "@board-games/db"
import { and, asc, eq } from "drizzle-orm"
import { AppError, notFound } from "../../lib/errors.js"

type DeckTypeInput = {
    name: string
    description?: string
}

const deckTypeFields = {
    id: schema.deckTypes.id,
    name: schema.deckTypes.name,
    description: schema.deckTypes.description,
    createdAt: schema.deckTypes.createdAt,
    updatedAt: schema.deckTypes.updatedAt,
}

function serializeDeckType(deckType: {
    id: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
}): DeckType {
    return deckTypeSchema.parse({
        ...deckType,
        createdAt: deckType.createdAt.toISOString(),
        updatedAt: deckType.updatedAt.toISOString(),
    })
}

function hasDatabaseCode(error: unknown, code: string): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code
    )
}

async function requireDeckType(deckTypeId: string): Promise<DeckType> {
    const [deckType] = await db
        .select(deckTypeFields)
        .from(schema.deckTypes)
        .where(eq(schema.deckTypes.id, deckTypeId))
        .limit(1)

    if (!deckType) throw notFound("Deck type")

    return serializeDeckType(deckType)
}

export async function listDeckTypes(): Promise<DeckTypeListResponse> {
    const deckTypes = await db
        .select(deckTypeFields)
        .from(schema.deckTypes)
        .orderBy(asc(schema.deckTypes.name))

    return deckTypeListResponseSchema.parse({
        deckTypes: deckTypes.map(serializeDeckType),
    })
}

export async function getDeckType(deckTypeId: string): Promise<DeckTypeDetail> {
    const deckType = await requireDeckType(deckTypeId)
    const [includedDecks, includedByDecks] = await Promise.all([
        db
            .select(deckTypeFields)
            .from(schema.deckTypeInclusions)
            .innerJoin(
                schema.deckTypes,
                eq(
                    schema.deckTypeInclusions.includedDeckTypeId,
                    schema.deckTypes.id,
                ),
            )
            .where(eq(schema.deckTypeInclusions.deckTypeId, deckTypeId))
            .orderBy(asc(schema.deckTypes.name)),
        db
            .select(deckTypeFields)
            .from(schema.deckTypeInclusions)
            .innerJoin(
                schema.deckTypes,
                eq(schema.deckTypeInclusions.deckTypeId, schema.deckTypes.id),
            )
            .where(eq(schema.deckTypeInclusions.includedDeckTypeId, deckTypeId))
            .orderBy(asc(schema.deckTypes.name)),
    ])

    return deckTypeDetailSchema.parse({
        ...deckType,
        includedDecks: includedDecks.map(serializeDeckType),
        includedByDecks: includedByDecks.map(serializeDeckType),
    })
}

export async function createDeckType(
    input: DeckTypeInput,
): Promise<DeckTypeDetail> {
    try {
        const [deckType] = await db
            .insert(schema.deckTypes)
            .values({
                name: input.name,
                description: input.description || null,
            })
            .returning({ id: schema.deckTypes.id })

        return getDeckType(deckType.id)
    } catch (error) {
        if (hasDatabaseCode(error, "23505")) {
            throw new AppError(
                409,
                "deck_type_name_taken",
                "A deck type with this name already exists",
            )
        }
        throw error
    }
}

export async function updateDeckType(
    deckTypeId: string,
    input: DeckTypeInput,
): Promise<DeckTypeDetail> {
    try {
        const [deckType] = await db
            .update(schema.deckTypes)
            .set({
                name: input.name,
                description: input.description || null,
                updatedAt: new Date(),
            })
            .where(eq(schema.deckTypes.id, deckTypeId))
            .returning({ id: schema.deckTypes.id })

        if (!deckType) throw notFound("Deck type")

        return getDeckType(deckType.id)
    } catch (error) {
        if (hasDatabaseCode(error, "23505")) {
            throw new AppError(
                409,
                "deck_type_name_taken",
                "A deck type with this name already exists",
            )
        }
        throw error
    }
}

export async function includeDeckType(
    deckTypeId: string,
    includedDeckTypeId: string,
): Promise<DeckTypeDetail> {
    await Promise.all([
        requireDeckType(deckTypeId),
        requireDeckType(includedDeckTypeId),
    ])

    if (deckTypeId === includedDeckTypeId) {
        throw new AppError(
            409,
            "deck_type_cycle",
            "A deck type cannot include itself",
        )
    }

    const inclusions = await db
        .select({
            deckTypeId: schema.deckTypeInclusions.deckTypeId,
            includedDeckTypeId: schema.deckTypeInclusions.includedDeckTypeId,
        })
        .from(schema.deckTypeInclusions)

    const includedDeckIds = new Map<string, string[]>()
    for (const inclusion of inclusions) {
        const children = includedDeckIds.get(inclusion.deckTypeId) ?? []
        children.push(inclusion.includedDeckTypeId)
        includedDeckIds.set(inclusion.deckTypeId, children)
    }

    const pending = [includedDeckTypeId]
    const visited = new Set<string>()
    while (pending.length > 0) {
        const currentDeckTypeId = pending.pop()!
        if (currentDeckTypeId === deckTypeId) {
            throw new AppError(
                409,
                "deck_type_cycle",
                "Adding this deck type would create a circular inclusion",
            )
        }
        if (visited.has(currentDeckTypeId)) continue

        visited.add(currentDeckTypeId)
        pending.push(...(includedDeckIds.get(currentDeckTypeId) ?? []))
    }

    await db
        .insert(schema.deckTypeInclusions)
        .values({ deckTypeId, includedDeckTypeId })
        .onConflictDoNothing()

    return getDeckType(deckTypeId)
}

export async function removeIncludedDeckType(
    deckTypeId: string,
    includedDeckTypeId: string,
): Promise<DeckTypeDetail> {
    await requireDeckType(deckTypeId)
    await db
        .delete(schema.deckTypeInclusions)
        .where(
            and(
                eq(schema.deckTypeInclusions.deckTypeId, deckTypeId),
                eq(
                    schema.deckTypeInclusions.includedDeckTypeId,
                    includedDeckTypeId,
                ),
            ),
        )

    return getDeckType(deckTypeId)
}

export async function deleteDeckType(deckTypeId: string): Promise<void> {
    try {
        const [deckType] = await db
            .delete(schema.deckTypes)
            .where(eq(schema.deckTypes.id, deckTypeId))
            .returning({ id: schema.deckTypes.id })

        if (!deckType) throw notFound("Deck type")
    } catch (error) {
        if (hasDatabaseCode(error, "23503")) {
            throw new AppError(
                409,
                "deck_type_in_use",
                "Remove this deck type from every deck that includes it before deleting it",
            )
        }
        throw error
    }
}
