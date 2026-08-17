import cors from "cors"
import express, { type Express } from "express"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { pinoHttp } from "pino-http"
import { logger } from "./lib/logger.js"
import { registerRoutes } from "./routes.js"

export function createApp(): Express {
    const app = express()
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

    app.use(
        pinoHttp({
            logger,
            redact: [
                "req.headers.authorization",
                "req.headers.cookie",
                "res.headers.set-cookie",
            ],
        }),
    )
    app.use(helmet())
    app.use(
        cors({
            origin: webOrigin,
            credentials: true,
        }),
    )
    app.use(express.json({ limit: "100kb" }))
    app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true }))

    registerRoutes(app)

    return app
}
