import type { Express } from "express"
import { gamesRouter } from "./features/games/game.router.js"
import { healthRouter } from "./features/health/health.router.js"
import { AppError } from "./lib/errors.js"
import { errorHandler } from "./middleware/error-handler.js"

export function registerRoutes(app: Express) {
    app.use("/api", healthRouter)
    app.use("/api/games", gamesRouter)
    app.use((_req, _res, next) => {
        next(
            new AppError(
                404,
                "not_found",
                "The requested resource was not found",
            ),
        )
    })
    app.use(errorHandler)
}
