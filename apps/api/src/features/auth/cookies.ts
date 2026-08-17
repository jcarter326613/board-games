import type { Request, Response } from "express"

export const accessCookieName = "access_token"
export const refreshCookieName = "refresh_token"

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        maxAge,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    }
}

export function setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
) {
    res.cookie(accessCookieName, accessToken, cookieOptions(60_000))
    res.cookie(
        refreshCookieName,
        refreshToken,
        cookieOptions(30 * 24 * 60 * 60 * 1000),
    )
}

export function clearAuthCookies(res: Response) {
    res.clearCookie(accessCookieName, cookieOptions(0))
    res.clearCookie(refreshCookieName, cookieOptions(0))
}

export function getCookie(req: Request, name: string): string | undefined {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) return undefined

    for (const cookie of cookieHeader.split(";")) {
        const [key, ...valueParts] = cookie.trim().split("=")
        if (key === name) {
            try {
                return decodeURIComponent(valueParts.join("="))
            } catch {
                return undefined
            }
        }
    }

    return undefined
}
