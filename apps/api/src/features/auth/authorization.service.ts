import { type AuthorizationRole } from "@board-games/contracts"
import { db, schema } from "@board-games/db"

export async function grantAuthorization(
    userId: string,
    role: AuthorizationRole,
): Promise<void> {
    await db
        .insert(schema.userAuthorizations)
        .values({ userId, role })
        .onConflictDoNothing()
}
