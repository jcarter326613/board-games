export interface Player {
    id: string
    name: string
}

export interface GameState {
    id: string
    players: Player[]
    currentTurn: string
    status: "waiting" | "playing" | "finished"
}
