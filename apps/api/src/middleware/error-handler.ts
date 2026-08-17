import type { ErrorRequestHandler } from "express"
import { ZodError } from "zod"
import { AppError } from "../lib/errors.js"

const problemBaseUrl = process.env.PROBLEM_BASE_URL?.trim()

if (!problemBaseUrl) {
    throw new Error("PROBLEM_BASE_URL must be set")
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400)
            .type("application/problem+json")
            .json({
                type: `${problemBaseUrl}/invalid-request`,
                title: "Invalid request",
                status: 400,
                detail: "One or more request fields are invalid.",
                errors: err.flatten(),
            })
        return
    }

    if (err instanceof AppError) {
        res.status(err.status)
            .type("application/problem+json")
            .json({
                type: `${problemBaseUrl}/${err.code}`,
                title: err.code,
                status: err.status,
                detail: err.message,
            })
        return
    }

    req.log.error({ err }, "Unhandled request error")
    res.status(500)
        .type("application/problem+json")
        .json({
            type: `${problemBaseUrl}/internal-error`,
            title: "Internal server error",
            status: 500,
        })
}
