import "./load-env.js"
import { createServer } from "node:http"
import { Server } from "socket.io"
import { createApp } from "./app.js"
import { logger } from "./lib/logger.js"
import { setupSocket } from "./socket/index.js"

const app = createApp()
const server = createServer(app)
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"
const io = new Server(server, {
    cors: {
        origin: webOrigin,
        methods: ["GET", "POST"],
        credentials: true,
    },
})

setupSocket(io)

const port = Number(process.env.API_PORT) || 3001

server.listen(port, () => {
    logger.info({ port }, "API server running")
})
