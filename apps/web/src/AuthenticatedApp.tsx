import { authorizationRoles, type AuthUser } from "@board-games/contracts"
import type { ReactNode } from "react"
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom"
import {
    AddCardPage,
    CreateDeckTypePage,
    DeckTypeEditorPage,
    DeckTypeListPage,
} from "./deck-types"

type AuthenticatedAppProps = {
    user: AuthUser
    onLogout: () => Promise<void>
    submitting: boolean
}

function AdministratorRoute({
    user,
    children,
}: {
    user: AuthUser
    children: ReactNode
}) {
    if (!user.roles.includes(authorizationRoles.administrator)) {
        return <Navigate replace to="/" />
    }

    return children
}

function Dashboard({ user }: { user: AuthUser }) {
    const isAdministrator = user.roles.includes(
        authorizationRoles.administrator,
    )

    return (
        <section className="welcome">
            <p className="eyebrow">Workshop access granted</p>
            <h1>Welcome, {user.displayName}</h1>
            <p className="lede">
                Your account is ready. Card construction and game tables will
                grow from this foundation.
            </p>
            <div className="role-list" aria-label="Account roles">
                {user.roles.map((role) => (
                    <span key={role}>{role}</span>
                ))}
            </div>
            {isAdministrator && (
                <Link
                    className="primary-link welcome-action"
                    to="/admin/deck-types"
                >
                    Manage deck types
                </Link>
            )}
        </section>
    )
}

export function AuthenticatedApp({
    user,
    onLogout,
    submitting,
}: AuthenticatedAppProps) {
    const isAdministrator = user.roles.includes(
        authorizationRoles.administrator,
    )

    return (
        <main className="shell">
            <header className="topbar">
                <Link className="brand" to="/">
                    Foundry Table
                </Link>
                <nav aria-label="Primary navigation" className="primary-nav">
                    {isAdministrator && (
                        <NavLink to="/admin/deck-types">Deck types</NavLink>
                    )}
                    <button
                        className="text-button"
                        disabled={submitting}
                        onClick={onLogout}
                    >
                        Sign out
                    </button>
                </nav>
            </header>
            <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route
                    path="/admin/deck-types"
                    element={
                        <AdministratorRoute user={user}>
                            <DeckTypeListPage />
                        </AdministratorRoute>
                    }
                />
                <Route
                    path="/admin/deck-types/new"
                    element={
                        <AdministratorRoute user={user}>
                            <CreateDeckTypePage />
                        </AdministratorRoute>
                    }
                />
                <Route
                    path="/admin/deck-types/:deckTypeId"
                    element={
                        <AdministratorRoute user={user}>
                            <DeckTypeEditorPage />
                        </AdministratorRoute>
                    }
                />
                <Route
                    path="/admin/deck-types/:deckTypeId/cards/new"
                    element={
                        <AdministratorRoute user={user}>
                            <AddCardPage />
                        </AdministratorRoute>
                    }
                />
                <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
        </main>
    )
}
