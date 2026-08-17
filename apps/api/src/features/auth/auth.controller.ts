import type { RequestHandler } from "express"
import type { AuthResponse, AuthStatus } from "@board-games/contracts"
import { AppError } from "../../lib/errors.js"
import {
    accessCookieName,
    clearAuthCookies,
    getCookie,
    refreshCookieName,
    setAuthCookies,
} from "./cookies.js"
import {
    getAuthStatus,
    login,
    logout,
    refreshSession,
    setupBootstrapAdministrator,
} from "./auth.service.js"
import { verifyAccessToken } from "./token.js"

export const status: RequestHandler<
    Record<string, string>,
    AuthStatus
> = async (_req, res) => {
    res.json(await getAuthStatus())
}

export const setup: RequestHandler<
    Record<string, string>,
    AuthResponse
> = async (_req, res) => {
    const session = await setupBootstrapAdministrator(res.locals.input.body)
    setAuthCookies(res, session.accessToken, session.refreshToken)
    res.status(201).json({ user: session.user })
}

export const logIn: RequestHandler<
    Record<string, string>,
    AuthResponse
> = async (_req, res) => {
    const { email, password } = res.locals.input.body
    const session = await login(email, password)
    setAuthCookies(res, session.accessToken, session.refreshToken)
    res.json({ user: session.user })
}

export const refresh: RequestHandler<
    Record<string, string>,
    AuthResponse
> = async (req, res) => {
    const refreshToken = getCookie(req, refreshCookieName)
    if (!refreshToken) {
        throw new AppError(
            401,
            "invalid_refresh_token",
            "The session has expired",
        )
    }

    const session = await refreshSession(refreshToken)
    setAuthCookies(res, session.accessToken, session.refreshToken)
    res.json({ user: session.user })
}

export const logOut: RequestHandler<Record<string, string>, void> = async (
    req,
    res,
) => {
    await logout(getCookie(req, refreshCookieName))
    clearAuthCookies(res)
    res.status(204).end()
}

export const me: RequestHandler<Record<string, string>, AuthResponse> = (
    req,
    res,
) => {
    const token = getCookie(req, accessCookieName)
    const user = token ? verifyAccessToken(token) : null

    if (!user) {
        throw new AppError(
            401,
            "authentication_required",
            "Authentication is required",
        )
    }

    res.json({ user })
}
