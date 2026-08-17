import {
    createHash,
    createHmac,
    randomBytes,
    timingSafeEqual,
} from "node:crypto"
import { z } from "zod"
import { authorizationRoleSchema, type AuthUser } from "@board-games/contracts"

const accessTokenLifetimeSeconds = 60

const accessClaimsSchema = z.object({
    sub: z.string().uuid(),
    displayName: z.string(),
    roles: z.array(authorizationRoleSchema),
    exp: z.number().int(),
})

function getSecret(): string {
    const secret = process.env.ACCESS_TOKEN_SECRET?.trim()

    if (!secret || secret.length < 32) {
        throw new Error(
            "ACCESS_TOKEN_SECRET must contain at least 32 characters",
        )
    }

    return secret
}

function encode(value: string): string {
    return Buffer.from(value).toString("base64url")
}

export function createAccessToken(user: AuthUser): string {
    const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    const payload = encode(
        JSON.stringify({
            sub: user.id,
            displayName: user.displayName,
            roles: user.roles,
            exp: Math.floor(Date.now() / 1000) + accessTokenLifetimeSeconds,
        }),
    )
    const unsignedToken = `${header}.${payload}`
    const signature = createHmac("sha256", getSecret())
        .update(unsignedToken)
        .digest("base64url")

    return `${unsignedToken}.${signature}`
}

export function verifyAccessToken(token: string): AuthUser | null {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [header, payload, signature] = parts
    if (!header || !payload || !signature) return null

    try {
        const parsedHeader = JSON.parse(
            Buffer.from(header, "base64url").toString("utf8"),
        ) as { alg?: unknown; typ?: unknown }
        if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT")
            return null
    } catch {
        return null
    }

    const expectedSignature = createHmac("sha256", getSecret())
        .update(`${header}.${payload}`)
        .digest()
    const actualSignature = Buffer.from(signature, "base64url")

    if (
        expectedSignature.length !== actualSignature.length ||
        !timingSafeEqual(expectedSignature, actualSignature)
    ) {
        return null
    }

    try {
        const claims = accessClaimsSchema.parse(
            JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
        )

        if (claims.exp <= Math.floor(Date.now() / 1000)) return null

        return {
            id: claims.sub,
            displayName: claims.displayName,
            roles: claims.roles,
        }
    } catch {
        return null
    }
}

export function createRefreshToken(): string {
    return randomBytes(32).toString("base64url")
}

export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
}
