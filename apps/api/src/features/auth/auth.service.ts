import { authorizationRoles, type AuthUser } from "@board-games/contracts"
import { db, schema } from "@board-games/db"
import { and, eq, lte, ne, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { AppError } from "../../lib/errors.js"
import { hashPassword, verifyPassword } from "./password.js"
import {
    createAccessToken,
    createRefreshToken,
    hashRefreshToken,
} from "./token.js"

const refreshTokenLifetimeMs = 30 * 24 * 60 * 60 * 1000 // 30 days

type CredentialsInput = {
    displayName: string
    email: string
    password: string
}

export type IssuedSession = {
    user: AuthUser
    accessToken: string
    refreshToken: string
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

async function loadUser(userId: string): Promise<AuthUser | null> {
    const [user] = await db
        .select({ id: schema.users.id, displayName: schema.users.displayName })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

    if (!user) return null

    const authorizations = await db
        .select({ role: schema.userAuthorizations.role })
        .from(schema.userAuthorizations)
        .where(eq(schema.userAuthorizations.userId, userId))

    return { ...user, roles: authorizations.map(({ role }) => role) }
}

async function issueSession(user: AuthUser): Promise<IssuedSession> {
    const refreshToken = createRefreshToken()
    const sessionId = randomUUID()

    await db.transaction(async (tx) => {
        await tx
            .delete(schema.refreshTokens)
            .where(lte(schema.refreshTokens.expiresAt, new Date()))
        await tx.insert(schema.refreshTokens).values({
            sessionId,
            userId: user.id,
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
        })
    })

    return {
        user,
        accessToken: createAccessToken(user),
        refreshToken,
    }
}

export async function getAuthStatus(): Promise<{ setupRequired: boolean }> {
    const [administrator] = await db
        .select({ userId: schema.userAuthorizations.userId })
        .from(schema.userAuthorizations)
        .where(
            eq(
                schema.userAuthorizations.role,
                authorizationRoles.administrator,
            ),
        )
        .limit(1)

    return { setupRequired: !administrator }
}

export async function setupBootstrapAdministrator(
    input: CredentialsInput,
): Promise<IssuedSession> {
    const passwordHash = await hashPassword(input.password)

    const createdUser = await db.transaction(async (tx) => {
        const [administrator] = await tx
            .select({ userId: schema.userAuthorizations.userId })
            .from(schema.userAuthorizations)
            .where(
                eq(
                    schema.userAuthorizations.role,
                    authorizationRoles.administrator,
                ),
            )
            .limit(1)

        if (administrator) {
            throw new AppError(
                409,
                "setup_complete",
                "An administrator has already been configured",
            )
        }

        const [user] = await tx
            .insert(schema.users)
            .values({ displayName: input.displayName.trim() })
            .returning({
                id: schema.users.id,
                displayName: schema.users.displayName,
            })

        await tx.insert(schema.credentials).values({
            userId: user.id,
            email: normalizeEmail(input.email),
            passwordHash,
        })
        await tx.insert(schema.userAuthorizations).values({
            userId: user.id,
            role: authorizationRoles.administrator,
        })

        return user
    })

    try {
        const refreshToken = createRefreshToken()
        const sessionId = randomUUID()

        await db.transaction(async (tx) => {
            await tx.insert(schema.bootstrapAdministrators).values({
                userId: createdUser.id,
            })

            await tx
                .delete(schema.refreshTokens)
                .where(lte(schema.refreshTokens.expiresAt, new Date()))
            await tx.insert(schema.refreshTokens).values({
                sessionId,
                userId: createdUser.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
            })
        })

        const user: AuthUser = {
            ...createdUser,
            roles: [authorizationRoles.administrator],
        }

        return {
            user,
            accessToken: createAccessToken(user),
            refreshToken,
        }
    } catch {
        await db.delete(schema.users).where(eq(schema.users.id, createdUser.id))
        throw new AppError(
            409,
            "setup_complete",
            "An administrator has already been configured",
        )
    }
}

export async function login(
    email: string,
    password: string,
): Promise<IssuedSession> {
    const [credential] = await db
        .select({
            userId: schema.credentials.userId,
            passwordHash: schema.credentials.passwordHash,
        })
        .from(schema.credentials)
        .where(eq(schema.credentials.email, normalizeEmail(email)))
        .limit(1)

    if (
        !credential ||
        !(await verifyPassword(password, credential.passwordHash))
    ) {
        throw new AppError(
            401,
            "invalid_credentials",
            "Email or password is incorrect",
        )
    }

    const [bootstrap] = await db
        .select({ userId: schema.bootstrapAdministrators.userId })
        .from(schema.bootstrapAdministrators)
        .where(eq(schema.bootstrapAdministrators.userId, credential.userId))
        .limit(1)

    if (bootstrap) {
        const refreshToken = createRefreshToken()
        const sessionId = randomUUID()

        return db.transaction(async (tx) => {
            const [regularAdministrator] = await tx
                .select({ userId: schema.userAuthorizations.userId })
                .from(schema.userAuthorizations)
                .where(
                    and(
                        eq(
                            schema.userAuthorizations.role,
                            authorizationRoles.administrator,
                        ),
                        ne(schema.userAuthorizations.userId, credential.userId),
                    ),
                )
                .limit(1)

            if (regularAdministrator) {
                throw new AppError(
                    403,
                    "bootstrap_admin_unavailable",
                    "The bootstrap administrator is unavailable while another administrator exists",
                )
            }

            const [bootstrapUser] = await tx
                .select({
                    id: schema.users.id,
                    displayName: schema.users.displayName,
                })
                .from(schema.users)
                .where(eq(schema.users.id, credential.userId))
                .limit(1)
            const authorizations = await tx
                .select({ role: schema.userAuthorizations.role })
                .from(schema.userAuthorizations)
                .where(eq(schema.userAuthorizations.userId, credential.userId))

            if (!bootstrapUser) {
                throw new AppError(
                    401,
                    "invalid_credentials",
                    "Email or password is incorrect",
                )
            }

            const user: AuthUser = {
                ...bootstrapUser,
                roles: authorizations.map(({ role }) => role),
            }

            await tx
                .delete(schema.refreshTokens)
                .where(lte(schema.refreshTokens.expiresAt, new Date()))
            await tx.insert(schema.refreshTokens).values({
                sessionId,
                userId: user.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
            })

            return {
                user,
                accessToken: createAccessToken(user),
                refreshToken,
            }
        })
    }

    const user = await loadUser(credential.userId)
    if (!user) {
        throw new AppError(
            401,
            "invalid_credentials",
            "Email or password is incorrect",
        )
    }

    return issueSession(user)
}

export async function refreshSession(rawToken: string): Promise<IssuedSession> {
    const tokenHash = hashRefreshToken(rawToken)
    const replacementToken = createRefreshToken()

    return db.transaction(async (tx) => {
        await tx
            .delete(schema.refreshTokens)
            .where(lte(schema.refreshTokens.expiresAt, new Date()))

        const rows = await tx.execute<{
            id: string
            user_id: string
            session_id: string
            expires_at: Date
        }>(sql`
            select id, user_id, session_id, expires_at
            from refresh_tokens
            where token_hash = ${tokenHash}
            for update
        `)
        const token = rows[0]

        if (!token || new Date(token.expires_at).getTime() <= Date.now()) {
            if (token) {
                await tx
                    .delete(schema.refreshTokens)
                    .where(eq(schema.refreshTokens.id, token.id))
            }
            throw new AppError(
                401,
                "invalid_refresh_token",
                "The session has expired",
            )
        }

        // LEAST preserves the first rotation deadline when concurrent refreshes queue.
        await tx.execute(sql`
            update refresh_tokens
            set expires_at = least(expires_at, clock_timestamp() + interval '30 seconds')
            where id = ${token.id}
        `)

        const [refreshedUser] = await tx
            .select({
                id: schema.users.id,
                displayName: schema.users.displayName,
            })
            .from(schema.users)
            .where(eq(schema.users.id, token.user_id))
            .limit(1)
        const authorizations = await tx
            .select({ role: schema.userAuthorizations.role })
            .from(schema.userAuthorizations)
            .where(eq(schema.userAuthorizations.userId, token.user_id))

        if (!refreshedUser) {
            throw new AppError(
                401,
                "invalid_refresh_token",
                "The session has expired",
            )
        }

        const user: AuthUser = {
            ...refreshedUser,
            roles: authorizations.map(({ role }) => role),
        }

        await tx.insert(schema.refreshTokens).values({
            sessionId: token.session_id,
            userId: user.id,
            tokenHash: hashRefreshToken(replacementToken),
            expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
        })

        return {
            user,
            accessToken: createAccessToken(user),
            refreshToken: replacementToken,
        }
    })
}

export async function logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return

    await db.transaction(async (tx) => {
        const rows = await tx.execute<{ session_id: string }>(sql`
            select session_id
            from refresh_tokens
            where token_hash = ${hashRefreshToken(rawToken)}
            for update
        `)
        const token = rows[0]
        if (!token) return

        await tx
            .delete(schema.refreshTokens)
            .where(eq(schema.refreshTokens.sessionId, token.session_id))
    })
}
