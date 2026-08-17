import type { Server, Socket } from "socket.io"
import { registerGameSocketHandlers } from "../features/games/game.socket.js"
import { logger } from "../lib/logger.js"

export function setupSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        logger.info({ socketId: socket.id }, "Client connected")
        registerGameSocketHandlers(socket)

        socket.on("disconnect", () => {
            logger.info({ socketId: socket.id }, "Client disconnected")
        })
    })
}
