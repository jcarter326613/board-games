import type { RequestHandler } from "express"
import type { AuthorizationRole } from "@board-games/contracts"
import { AppError } from "../lib/errors.js"
import { accessCookieName, getCookie } from "../features/auth/cookies.js"
import { verifyAccessToken } from "../features/auth/token.js"

export const authenticate: RequestHandler = (req, res, next) => {
    const token = getCookie(req, accessCookieName)
    const user = token ? verifyAccessToken(token) : null

    if (!user) {
        next(
            new AppError(
                401,
                "authentication_required",
                "Authentication is required",
            ),
        )
        return
    }

    res.locals.user = user
    next()
}

export function requireRole(role: AuthorizationRole): RequestHandler {
    return (_req, res, next) => {
        if (!res.locals.user?.roles.includes(role)) {
            next(
                new AppError(
                    403,
                    "forbidden",
                    "You do not have permission to access this resource",
                ),
            )
            return
        }

        next()
    }
}
