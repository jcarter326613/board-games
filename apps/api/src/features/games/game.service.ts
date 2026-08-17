import { db, schema } from "@board-games/db"
import { gameSchema, type Game } from "@board-games/contracts"
import { eq } from "drizzle-orm"
import { notFound } from "../../lib/errors.js"

export async function getGame(gameId: string): Promise<Game> {
    const game = await db.query.games.findFirst({
        where: eq(schema.games.id, gameId),
    })

    if (!game) {
        throw notFound("Game")
    }

    return gameSchema.parse({
        ...game,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    })
}
