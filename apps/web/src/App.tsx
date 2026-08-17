import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { healthResponseSchema } from "@board-games/contracts"

const socket = io({ autoConnect: false })

export function App() {
    const [health, setHealth] = useState<string | null>(null)

    useEffect(() => {
        async function checkHealth() {
            try {
                const response = await fetch("/api/health")
                const data = healthResponseSchema.parse(await response.json())
                setHealth(data.status)
            } catch {
                setHealth("error")
            }
        }

        void checkHealth()
    }, [])

    useEffect(() => {
        socket.connect()
        socket.on("connect", () => {
            console.log("Connected to server:", socket.id)
        })

        return () => {
            socket.off("connect")
            socket.disconnect()
        }
    }, [])

    return (
        <div>
            <h1>Board Games</h1>
            <p>API Status: {health ?? "loading..."}</p>
        </div>
    )
}
