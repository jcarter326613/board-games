import { z } from "zod"
import { Router } from "express"
import { validateRequest } from "../../middleware/validate-request.js"
import { getGameById } from "./game.controller.js"

const getGameSchema = z.object({
    params: z.object({
        gameId: z.string().uuid(),
    }),
})

export const gamesRouter: Router = Router()

gamesRouter.get("/:gameId", validateRequest(getGameSchema), getGameById)
