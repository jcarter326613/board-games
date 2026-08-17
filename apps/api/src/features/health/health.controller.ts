import type { RequestHandler } from "express"
import { healthResponseSchema } from "@board-games/contracts"

export const getHealth: RequestHandler = (_req, res) => {
    const response = healthResponseSchema.parse({
        status: "ok",
        timestamp: new Date().toISOString(),
    })

    res.json(response)
}
