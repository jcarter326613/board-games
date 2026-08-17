import type { RequestHandler } from "express"
import type { HealthResponse } from "@board-games/contracts"
import { healthResponseSchema } from "@board-games/contracts"

export const getHealth: RequestHandler<
    Record<string, string>,
    HealthResponse
> = (_req, res) => {
    const response = healthResponseSchema.parse({
        status: "ok",
        timestamp: new Date().toISOString(),
    })

    res.json(response)
}
