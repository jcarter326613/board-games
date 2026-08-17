import type { RequestHandler } from "express"
import { getGame } from "./game.service.js"

export const getGameById: RequestHandler = async (_req, res) => {
    const { gameId } = res.locals.input.params as { gameId: string }
    const game = await getGame(gameId)

    res.json(game)
}
