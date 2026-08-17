export class AppError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
    ) {
        super(message)
        this.name = "AppError"
    }
}

export const notFound = (resource: string) =>
    new AppError(404, "not_found", `${resource} was not found`)
