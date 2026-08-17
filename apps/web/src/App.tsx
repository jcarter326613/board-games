import { useEffect, useState, type FormEvent } from "react"
import {
    authResponseSchema,
    authStatusSchema,
    type AuthUser,
} from "@board-games/contracts"
import "./App.css"

type View = "loading" | "setup" | "login" | "authenticated"

async function errorMessage(response: Response): Promise<string> {
    try {
        const problem = (await response.json()) as { detail?: string }
        return problem.detail ?? "The request could not be completed."
    } catch {
        return "The request could not be completed."
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

    useEffect(() => {
        async function restoreSession() {
            try {
                const statusResponse = await fetch("/api/auth/status")
                const status = authStatusSchema.parse(
                    await statusResponse.json(),
                )

                if (status.setupRequired) {
                    setView("setup")
                    return
                }

                const meResponse = await fetch("/api/auth/me")
                if (meResponse.ok) {
                    const { user: currentUser } = authResponseSchema.parse(
                        await meResponse.json(),
                    )
                    setUser(currentUser)
                    setView("authenticated")
                    return
                }

                const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "POST",
                })
                if (!refreshResponse.ok) {
                    setView("login")
                    return
                }

                const { user: currentUser } = authResponseSchema.parse(
                    await refreshResponse.json(),
                )
                setUser(currentUser)
                setView("authenticated")
            } catch {
                setError("Unable to connect to the authentication service.")
                setView("login")
            }
        }

        void restoreSession()
    }, [])

    async function submitCredentials(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSubmitting(true)

        const endpoint =
            view === "setup" ? "/api/auth/setup" : "/api/auth/login"
        const body =
            view === "setup"
                ? { displayName, email, password }
                : { email, password }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                setError(await errorMessage(response))
                return
            }

            const auth = authResponseSchema.parse(await response.json())
            setUser(auth.user)
            setPassword("")
            setView("authenticated")
        } catch {
            setError("Unable to connect to the authentication service.")
        } finally {
            setSubmitting(false)
        }
    }

    async function logOut() {
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
            <main className="shell">
                <header className="topbar">
                    <a className="brand" href="/">
                        Foundry Table
                    </a>
                    <button
                        className="text-button"
                        onClick={logOut}
                        disabled={submitting}
                    >
                        Sign out
                    </button>
                </header>
                <section className="welcome">
                    <p className="eyebrow">Workshop access granted</p>
                    <h1>Welcome, {user.displayName}</h1>
                    <p className="lede">
                        Your account is ready. Card construction and game tables
                        will grow from this foundation.
                    </p>
                    <div className="role-list" aria-label="Account roles">
                        {user.roles.map((role) => (
                            <span key={role}>{role}</span>
                        ))}
                    </div>
                </section>
            </main>
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
                        ? "Create the bootstrap administrator. This account is your recovery key until another administrator is appointed."
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
