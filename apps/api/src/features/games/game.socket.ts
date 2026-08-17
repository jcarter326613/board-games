import {
    joinGameResponseSchema,
    joinGameSchema,
    socketErrorSchema,
    type JoinGameResponse,
    type SocketError,
} from "@board-games/contracts"
import type { Socket } from "socket.io"
import { AppError } from "../../lib/errors.js"
import { logger } from "../../lib/logger.js"
import { getGame } from "./game.service.js"

type JoinGameAcknowledgement = (
    response: JoinGameResponse | SocketError,
) => void

export function registerGameSocketHandlers(socket: Socket) {
    socket.on(
        "game:join",
        async (payload: unknown, acknowledge: JoinGameAcknowledgement) => {
            const parsed = joinGameSchema.safeParse(payload)

            if (!parsed.success) {
                acknowledge(
                    socketErrorSchema.parse({
                        ok: false,
                        code: "invalid_request",
                        message: "A valid game ID is required.",
                    }),
                )
                return
            }

            try {
                const game = await getGame(parsed.data.gameId)
                await socket.join(`game:${game.id}`)
                acknowledge(joinGameResponseSchema.parse({ ok: true, game }))
            } catch (error) {
                const message =
                    error instanceof AppError && error.status < 500
                        ? error.message
                        : "Unable to join the game."

                logger.error(
                    { err: error, socketId: socket.id },
                    "Unable to join game",
                )
                acknowledge(
                    socketErrorSchema.parse({
                        ok: false,
                        code:
                            error instanceof AppError
                                ? error.code
                                : "internal_error",
                        message,
                    }),
                )
            }
        },
    )
}
