import { z } from "zod"

export const gameStatusSchema = z.enum(["waiting", "playing", "finished"])

export const gameSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    status: gameStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const healthResponseSchema = z.object({
    status: z.literal("ok"),
    timestamp: z.string().datetime(),
})

export const authorizationRoles = {
    player: "player",
    administrator: "administrator",
} as const

export const authorizationRoleSchema = z.enum([
    authorizationRoles.player,
    authorizationRoles.administrator,
])

export const authUserSchema = z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    roles: z.array(authorizationRoleSchema),
})

export const setupRequestSchema = z.object({
    body: z.object({
        displayName: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(320),
        password: z.string().min(12).max(128),
    }),
})

export const loginRequestSchema = z.object({
    body: z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(1).max(128),
    }),
})

export const authResponseSchema = z.object({
    user: authUserSchema,
})

export const deckTypeSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const deckTypeDetailSchema = deckTypeSchema.extend({
    includedDecks: z.array(deckTypeSchema),
    includedByDecks: z.array(deckTypeSchema),
})

export const deckTypeListResponseSchema = z.object({
    deckTypes: z.array(deckTypeSchema),
})

export const createDeckTypeRequestSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).max(255),
        description: z.string().trim().max(2_000).optional(),
    }),
})

export const updateDeckTypeRequestSchema = z.object({
    params: z.object({ deckTypeId: z.string().uuid() }),
    body: z.object({
        name: z.string().trim().min(1).max(255),
        description: z.string().trim().max(2_000).optional(),
    }),
})

export const deckTypeIdParamsSchema = z.object({
    params: z.object({ deckTypeId: z.string().uuid() }),
})

export const includeDeckTypeRequestSchema = z.object({
    params: z.object({ deckTypeId: z.string().uuid() }),
    body: z.object({ includedDeckTypeId: z.string().uuid() }),
})

export const includedDeckTypeParamsSchema = z.object({
    params: z.object({
        deckTypeId: z.string().uuid(),
        includedDeckTypeId: z.string().uuid(),
    }),
})

export const joinGameSchema = z.object({
    gameId: z.string().uuid(),
})

export const joinGameResponseSchema = z.object({
    ok: z.literal(true),
    game: gameSchema,
})

export const socketErrorSchema = z.object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
})

export type Game = z.infer<typeof gameSchema>
export type GameStatus = z.infer<typeof gameStatusSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type AuthorizationRole = z.infer<typeof authorizationRoleSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type DeckType = z.infer<typeof deckTypeSchema>
export type DeckTypeDetail = z.infer<typeof deckTypeDetailSchema>
export type DeckTypeListResponse = z.infer<typeof deckTypeListResponseSchema>
export type JoinGame = z.infer<typeof joinGameSchema>
export type JoinGameResponse = z.infer<typeof joinGameResponseSchema>
export type SocketError = z.infer<typeof socketErrorSchema>
