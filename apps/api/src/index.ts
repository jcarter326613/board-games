import "dotenv/config"
import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import { healthRouter } from "./routes/health.js"
import { setupSocket } from "./socket/index.js"

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.WEB_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

app.use(cors())
app.use(express.json())
app.use("/api", healthRouter)

setupSocket(io)

const port = Number(process.env.API_PORT) || 3001

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
