import {
    deckTypeDetailSchema,
    deckTypeListResponseSchema,
    type DeckType,
    type DeckTypeDetail,
} from "@board-games/contracts"
import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ApiError, apiRequest } from "./api"

function errorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "The request could not be completed."
}

function DeckTypeForm({
    deckType,
    onSubmit,
    submitting,
}: {
    deckType?: DeckType
    onSubmit: (input: { name: string; description: string }) => void
    submitting: boolean
}) {
    const [name, setName] = useState(deckType?.name ?? "")
    const [description, setDescription] = useState(deckType?.description ?? "")

    useEffect(() => {
        setName(deckType?.name ?? "")
        setDescription(deckType?.description ?? "")
    }, [deckType])

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onSubmit({ name, description })
    }

    return (
        <form className="editor-form" onSubmit={submit}>
            <label>
                Deck name
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={255}
                />
            </label>
            <label>
                Description <span>(optional)</span>
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={2_000}
                    rows={5}
                />
            </label>
            <button
                className="primary-button"
                disabled={submitting}
                type="submit"
            >
                {submitting ? "Saving..." : "Save deck"}
            </button>
        </form>
    )
}

export function DeckTypeListPage() {
    const [deckTypes, setDeckTypes] = useState<DeckType[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true

        void apiRequest("/api/deck-types", deckTypeListResponseSchema)
            .then(({ deckTypes: loadedDeckTypes }) => {
                if (!active) return
                setDeckTypes(loadedDeckTypes)
            })
            .catch((loadError: unknown) => {
                if (!active) return
                setError(errorMessage(loadError))
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    return (
        <section className="admin-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Deck workshop</p>
                    <h1>Deck types</h1>
                    <p>
                        Build independent card collections, then compose them
                        into other decks without duplicating cards.
                    </p>
                </div>
                <Link className="primary-link" to="/admin/deck-types/new">
                    New deck type
                </Link>
            </div>

            {loading && <p className="status-message">Loading deck types...</p>}
            {error && <p className="form-error">{error}</p>}
            {!loading && !error && deckTypes.length === 0 && (
                <section className="empty-state">
                    <p className="eyebrow">No definitions yet</p>
                    <h2>Start with a deck.</h2>
                    <p>
                        Each deck owns its cards and can include other
                        independent decks.
                    </p>
                    <Link className="primary-link" to="/admin/deck-types/new">
                        Create the first deck type
                    </Link>
                </section>
            )}
            {!loading && !error && deckTypes.length > 0 && (
                <div className="deck-list">
                    {deckTypes.map((deckType) => (
                        <Link
                            className="deck-list-item"
                            key={deckType.id}
                            to={`/admin/deck-types/${deckType.id}`}
                        >
                            <span>
                                <strong>{deckType.name}</strong>
                                <small>
                                    {deckType.description || "No description"}
                                </small>
                            </span>
                            <span aria-hidden="true">Edit</span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}

export function CreateDeckTypePage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function createDeckType(input: { name: string; description: string }) {
        setError(null)
        setSubmitting(true)
        void apiRequest("/api/deck-types", deckTypeDetailSchema, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
        })
            .then((deckType) => {
                void navigate(`/admin/deck-types/${deckType.id}`)
            })
            .catch((requestError: unknown) => {
                setError(errorMessage(requestError))
            })
            .finally(() => setSubmitting(false))
    }

    return (
        <section className="admin-page narrow-page">
            <Link className="back-link" to="/admin/deck-types">
                Back to deck types
            </Link>
            <p className="eyebrow">New definition</p>
            <h1>Create deck type</h1>
            <p className="page-copy">
                This deck begins empty. Add cards and include other decks from
                its editor.
            </p>
            {error && <p className="form-error">{error}</p>}
            <DeckTypeForm onSubmit={createDeckType} submitting={submitting} />
        </section>
    )
}

export function DeckTypeEditorPage() {
    const { deckTypeId } = useParams()
    const navigate = useNavigate()
    const [deckType, setDeckType] = useState<DeckTypeDetail | null>(null)
    const [allDeckTypes, setAllDeckTypes] = useState<DeckType[]>([])
    const [selectedDeckTypeId, setSelectedDeckTypeId] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!deckTypeId) return
        let active = true

        void Promise.all([
            apiRequest(`/api/deck-types/${deckTypeId}`, deckTypeDetailSchema),
            apiRequest("/api/deck-types", deckTypeListResponseSchema),
        ])
            .then(([loadedDeckType, { deckTypes }]) => {
                if (!active) return
                setDeckType(loadedDeckType)
                setAllDeckTypes(deckTypes)
            })
            .catch((loadError: unknown) => {
                if (active) setError(errorMessage(loadError))
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [deckTypeId])

    function saveDeckType(input: { name: string; description: string }) {
        if (!deckType) return
        setError(null)
        setSubmitting(true)
        void apiRequest(
            `/api/deck-types/${deckType.id}`,
            deckTypeDetailSchema,
            {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(input),
            },
        )
            .then(setDeckType)
            .catch((requestError: unknown) =>
                setError(errorMessage(requestError)),
            )
            .finally(() => setSubmitting(false))
    }

    function includeDeckType() {
        if (!deckType || !selectedDeckTypeId) return
        setError(null)
        setSubmitting(true)
        void apiRequest(
            `/api/deck-types/${deckType.id}/included-decks`,
            deckTypeDetailSchema,
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    includedDeckTypeId: selectedDeckTypeId,
                }),
            },
        )
            .then((updatedDeckType) => {
                setDeckType(updatedDeckType)
                setSelectedDeckTypeId("")
            })
            .catch((requestError: unknown) =>
                setError(errorMessage(requestError)),
            )
            .finally(() => setSubmitting(false))
    }

    function removeIncludedDeckType(includedDeckTypeId: string) {
        if (!deckType) return
        setError(null)
        setSubmitting(true)
        void apiRequest(
            `/api/deck-types/${deckType.id}/included-decks/${includedDeckTypeId}`,
            deckTypeDetailSchema,
            { method: "DELETE" },
        )
            .then(setDeckType)
            .catch((requestError: unknown) =>
                setError(errorMessage(requestError)),
            )
            .finally(() => setSubmitting(false))
    }

    function deleteDeckType() {
        if (!deckType || !window.confirm(`Delete ${deckType.name}?`)) return
        setError(null)
        setSubmitting(true)
        void fetch(`/api/deck-types/${deckType.id}`, { method: "DELETE" })
            .then(async (response) => {
                if (response.ok) {
                    void navigate("/admin/deck-types")
                    return
                }

                const detail = await response
                    .json()
                    .then((problem: { detail?: string }) => problem.detail)
                    .catch(() => undefined)
                throw new ApiError(
                    response.status,
                    undefined,
                    detail ?? "The request could not be completed.",
                )
            })
            .catch((requestError: unknown) =>
                setError(errorMessage(requestError)),
            )
            .finally(() => setSubmitting(false))
    }

    if (loading) {
        return <p className="status-message">Loading deck type...</p>
    }

    if (!deckType) {
        return (
            <section className="admin-page narrow-page">
                <Link className="back-link" to="/admin/deck-types">
                    Back to deck types
                </Link>
                <p className="form-error">{error ?? "Deck type not found."}</p>
            </section>
        )
    }

    const includedDeckTypeIds = new Set(
        deckType.includedDecks.map(({ id }) => id),
    )
    const availableDeckTypes = allDeckTypes.filter(
        ({ id }) => id !== deckType.id && !includedDeckTypeIds.has(id),
    )

    return (
        <section className="admin-page">
            <Link className="back-link" to="/admin/deck-types">
                Back to deck types
            </Link>
            <div className="editor-heading">
                <div>
                    <p className="eyebrow">Deck editor</p>
                    <h1>{deckType.name}</h1>
                </div>
                <Link
                    className="primary-link"
                    to={`/admin/deck-types/${deckType.id}/cards/new`}
                >
                    Add card
                </Link>
            </div>
            {error && <p className="form-error">{error}</p>}

            <div className="editor-grid">
                <section className="editor-panel">
                    <h2>Deck details</h2>
                    <DeckTypeForm
                        deckType={deckType}
                        onSubmit={saveDeckType}
                        submitting={submitting}
                    />
                </section>

                <section className="editor-panel">
                    <h2>Included decks</h2>
                    <p>
                        Included decks remain independent. Their cards are
                        resolved recursively when this deck is used.
                    </p>
                    <div className="include-controls">
                        <select
                            value={selectedDeckTypeId}
                            onChange={(event) =>
                                setSelectedDeckTypeId(event.target.value)
                            }
                        >
                            <option value="">Select an existing deck</option>
                            {availableDeckTypes.map((availableDeckType) => (
                                <option
                                    key={availableDeckType.id}
                                    value={availableDeckType.id}
                                >
                                    {availableDeckType.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="secondary-button"
                            disabled={submitting || !selectedDeckTypeId}
                            onClick={includeDeckType}
                            type="button"
                        >
                            Include deck
                        </button>
                    </div>
                    {deckType.includedDecks.length === 0 ? (
                        <p className="muted-copy">No decks included yet.</p>
                    ) : (
                        <ul className="deck-reference-list">
                            {deckType.includedDecks.map((includedDeckType) => (
                                <li key={includedDeckType.id}>
                                    <Link
                                        to={`/admin/deck-types/${includedDeckType.id}`}
                                    >
                                        {includedDeckType.name}
                                    </Link>
                                    <button
                                        className="text-button"
                                        disabled={submitting}
                                        onClick={() =>
                                            removeIncludedDeckType(
                                                includedDeckType.id,
                                            )
                                        }
                                        type="button"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="editor-panel">
                    <h2>Included by</h2>
                    {deckType.includedByDecks.length === 0 ? (
                        <p className="muted-copy">
                            No other deck includes this deck.
                        </p>
                    ) : (
                        <ul className="deck-reference-list">
                            {deckType.includedByDecks.map(
                                (includingDeckType) => (
                                    <li key={includingDeckType.id}>
                                        <Link
                                            to={`/admin/deck-types/${includingDeckType.id}`}
                                        >
                                            {includingDeckType.name}
                                        </Link>
                                    </li>
                                ),
                            )}
                        </ul>
                    )}
                </section>

                <section className="editor-panel danger-panel">
                    <h2>Delete deck</h2>
                    <p>
                        Deletion is blocked while another deck includes this
                        one.
                    </p>
                    <button
                        className="danger-button"
                        disabled={submitting}
                        onClick={deleteDeckType}
                        type="button"
                    >
                        Delete deck type
                    </button>
                </section>
            </div>
        </section>
    )
}

export function AddCardPage() {
    const { deckTypeId } = useParams()
    const [deckType, setDeckType] = useState<DeckTypeDetail | null>(null)

    useEffect(() => {
        if (!deckTypeId) return
        let active = true
        void apiRequest(`/api/deck-types/${deckTypeId}`, deckTypeDetailSchema)
            .then((loadedDeckType) => {
                if (active) setDeckType(loadedDeckType)
            })
            .catch(() => undefined)

        return () => {
            active = false
        }
    }, [deckTypeId])

    const editorPath = deckTypeId
        ? `/admin/deck-types/${deckTypeId}`
        : "/admin/deck-types"

    return (
        <section className="admin-page narrow-page">
            <Link className="back-link" to={editorPath}>
                Back to deck editor
            </Link>
            <p className="eyebrow">Card workshop</p>
            <h1>Add card{deckType ? ` to ${deckType.name}` : ""}</h1>
            <p className="page-copy">
                Card fields will appear here when card types are defined. Cards
                created for this deck will not be reusable by another deck.
            </p>
            <section className="editor-panel card-type-placeholder">
                <label>
                    Card type
                    <select disabled value="">
                        <option>No card types configured</option>
                    </select>
                </label>
                <p className="muted-copy">
                    Define the first card type to unlock its design controls.
                </p>
            </section>
        </section>
    )
}
