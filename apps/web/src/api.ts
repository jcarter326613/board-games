type ResponseSchema<T> = {
    parse(value: unknown): T
}

export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly title: string | undefined,
        message: string,
    ) {
        super(message)
    }
}

async function readProblem(response: Response): Promise<{
    title?: string
    detail?: string
}> {
    try {
        return (await response.json()) as { title?: string; detail?: string }
    } catch {
        return {}
    }
}

export async function apiRequest<T>(
    url: string,
    schema: ResponseSchema<T>,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(url, options)

    if (!response.ok) {
        const problem = await readProblem(response)
        throw new ApiError(
            response.status,
            problem.title,
            problem.detail ?? "The request could not be completed.",
        )
    }

    return schema.parse(await response.json())
}
