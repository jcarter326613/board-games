import { z } from "zod"

export const gameStatusSchema = z.enum(["waiting", "playing", "finished"])

export const gameSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    status: gameStatusSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const healthResponseSchema = z.object({
    status: z.literal("ok"),
    timestamp: z.string().datetime(),
})

export const joinGameSchema = z.object({
    gameId: z.string().uuid(),
})

export const joinGameResponseSchema = z.object({
    ok: z.literal(true),
    game: gameSchema,
})

export const socketErrorSchema = z.object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
})

export type Game = z.infer<typeof gameSchema>
export type GameStatus = z.infer<typeof gameStatusSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type JoinGame = z.infer<typeof joinGameSchema>
export type JoinGameResponse = z.infer<typeof joinGameResponseSchema>
export type SocketError = z.infer<typeof socketErrorSchema>
