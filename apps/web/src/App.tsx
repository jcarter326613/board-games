import { useEffect, useRef, useState, type FormEvent } from "react"
import { authResponseSchema, type AuthUser } from "@board-games/contracts"
import { AuthenticatedApp } from "./AuthenticatedApp"
import "./App.css"

type View = "loading" | "setup" | "login" | "authenticated"

const accessTokenRefreshMs = 45_000
const refreshRetryMs = 5_000

async function errorProblem(response: Response): Promise<{
    title?: string
    detail?: string
}> {
    try {
        return (await response.json()) as {
            title?: string
            detail?: string
        }
    } catch {
        return {}
    }
}

export function App() {
    const [view, setView] = useState<View>("loading")
    const [user, setUser] = useState<AuthUser | null>(null)
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const refreshTimer = useRef<number | null>(null)

    function clearRefreshTimer() {
        if (refreshTimer.current !== null) {
            window.clearTimeout(refreshTimer.current)
            refreshTimer.current = null
        }
    }

    function scheduleRefresh(delay = accessTokenRefreshMs) {
        clearRefreshTimer()
        refreshTimer.current = window.setTimeout(() => {
            void refreshSession()
        }, delay)
    }

    async function refreshSession() {
        try {
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
            })

            if (!response.ok) {
                clearRefreshTimer()
                setUser(null)
                setView("login")
                return
            }

            const { user: currentUser } = authResponseSchema.parse(
                await response.json(),
            )
            setError(null)
            setUser(currentUser)
            setView("authenticated")
            scheduleRefresh()
        } catch {
            scheduleRefresh(refreshRetryMs)
        }
    }

    useEffect(() => {
        void (async () => {
            try {
                await refreshSession()
            } catch {
                setError("Unable to connect to the authentication service.")
                setView("login")
            }
        })()

        return clearRefreshTimer
    }, [])

    async function submitCredentials(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSubmitting(true)

        const isSetup = view === "setup"
        const endpoint = isSetup ? "/api/auth/setup" : "/api/auth/login"
        const body = isSetup
            ? { displayName, email, password }
            : { email, password }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const problem = await errorProblem(response)

                if (view === "login" && problem.title === "setup_required") {
                    setView("setup")
                    return
                }

                setError(
                    problem.detail ?? "The request could not be completed.",
                )
                return
            }

            if (isSetup) {
                setEmail("")
                setPassword("")
                setView("login")
                return
            }

            const auth = authResponseSchema.parse(await response.json())
            setUser(auth.user)
            setPassword("")
            setView("authenticated")
            scheduleRefresh()
        } catch {
            setError("Unable to connect to the authentication service.")
        } finally {
            setSubmitting(false)
        }
    }

    async function logOut() {
        clearRefreshTimer()
        setSubmitting(true)
        try {
            await fetch("/api/auth/logout", { method: "POST" })
        } finally {
            setUser(null)
            setPassword("")
            setSubmitting(false)
            setView("login")
        }
    }

    if (view === "loading") {
        return <main className="loading">Preparing the table...</main>
    }

    if (view === "authenticated" && user) {
        return (
            <AuthenticatedApp
                onLogout={logOut}
                submitting={submitting}
                user={user}
            />
        )
    }

    const isSetup = view === "setup"

    return (
        <main className="auth-layout">
            <section className="auth-intro">
                <p className="eyebrow">Foundry Table</p>
                <h1>
                    {isSetup ? "Open the workshop." : "Return to the workshop."}
                </h1>
                <p>
                    {isSetup
                        ? "Create the first administrator account."
                        : "Sign in to manage your games, cards, and tables."}
                </p>
            </section>
            <section className="auth-panel">
                <form onSubmit={submitCredentials}>
                    <div className="form-heading">
                        <span>
                            {isSetup ? "01 / First run" : "Account access"}
                        </span>
                        <h2>{isSetup ? "Create administrator" : "Sign in"}</h2>
                    </div>
                    {isSetup && (
                        <label>
                            Display name
                            <input
                                name="displayName"
                                autoComplete="name"
                                value={displayName}
                                onChange={(event) =>
                                    setDisplayName(event.target.value)
                                }
                                required
                                maxLength={100}
                            />
                        </label>
                    )}
                    <label>
                        Email address
                        <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            autoComplete={
                                isSetup ? "new-password" : "current-password"
                            }
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            minLength={isSetup ? 12 : 1}
                        />
                        {isSetup && <small>Use at least 12 characters.</small>}
                    </label>
                    {error && <p className="form-error">{error}</p>}
                    <button
                        className="primary-button"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Working..."
                            : isSetup
                              ? "Create workshop"
                              : "Enter workshop"}
                    </button>
                </form>
            </section>
        </main>
    )
}
