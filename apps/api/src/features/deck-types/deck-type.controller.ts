import type {
    DeckTypeDetail,
    DeckTypeListResponse,
} from "@board-games/contracts"
import type { RequestHandler } from "express"
import {
    createDeckType,
    deleteDeckType,
    getDeckType,
    includeDeckType,
    listDeckTypes,
    removeIncludedDeckType,
    updateDeckType,
} from "./deck-type.service.js"

export const list: RequestHandler<
    Record<string, string>,
    DeckTypeListResponse
> = async (_req, res) => {
    res.json(await listDeckTypes())
}

export const create: RequestHandler<
    Record<string, string>,
    DeckTypeDetail
> = async (_req, res) => {
    res.status(201).json(await createDeckType(res.locals.input.body))
}

export const get: RequestHandler<
    { deckTypeId: string },
    DeckTypeDetail
> = async (_req, res) => {
    res.json(await getDeckType(res.locals.input.params.deckTypeId))
}

export const update: RequestHandler<
    { deckTypeId: string },
    DeckTypeDetail
> = async (_req, res) => {
    const { deckTypeId } = res.locals.input.params
    res.json(await updateDeckType(deckTypeId, res.locals.input.body))
}

export const include: RequestHandler<
    { deckTypeId: string },
    DeckTypeDetail
> = async (_req, res) => {
    const { deckTypeId } = res.locals.input.params
    const { includedDeckTypeId } = res.locals.input.body
    res.status(201).json(await includeDeckType(deckTypeId, includedDeckTypeId))
}

export const removeIncluded: RequestHandler<
    { deckTypeId: string; includedDeckTypeId: string },
    DeckTypeDetail
> = async (_req, res) => {
    const { deckTypeId, includedDeckTypeId } = res.locals.input.params
    res.json(await removeIncludedDeckType(deckTypeId, includedDeckTypeId))
}

export const remove: RequestHandler<{ deckTypeId: string }, void> = async (
    _req,
    res,
) => {
    await deleteDeckType(res.locals.input.params.deckTypeId)
    res.status(204).end()
}
