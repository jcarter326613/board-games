import {
    authorizationRoles,
    type AuthorizationRole,
} from "@board-games/contracts"
import { db, schema } from "@board-games/db"
import { eq } from "drizzle-orm"

export async function grantAuthorization(
    userId: string,
    role: AuthorizationRole,
): Promise<void> {
    await db.transaction(async (tx) => {
        await tx
            .insert(schema.userAuthorizations)
            .values({ userId, role })
            .onConflictDoNothing()

        if (role !== authorizationRoles.administrator) return

        const [bootstrap] = await tx
            .select({ userId: schema.bootstrapAdministrators.userId })
            .from(schema.bootstrapAdministrators)
            .limit(1)

        if (bootstrap && bootstrap.userId !== userId) {
            await tx
                .delete(schema.refreshTokens)
                .where(eq(schema.refreshTokens.userId, bootstrap.userId))
        }
    })
}
