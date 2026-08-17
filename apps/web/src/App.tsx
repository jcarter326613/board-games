import { useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io()

export function App() {
  const [health, setHealth] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth("error"))
  }, [])

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id)
    })

    return () => {
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
