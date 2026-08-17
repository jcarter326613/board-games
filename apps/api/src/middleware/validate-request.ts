import type { RequestHandler } from "express"
import type { ZodType } from "zod"

export function validateRequest(schema: ZodType): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        })

        if (!parsed.success) {
            next(parsed.error)
            return
        }

        res.locals.input = parsed.data
        next()
    }
}
