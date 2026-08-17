import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

const directory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(directory, "../../.env") })

export default defineConfig({
    schema: "./src/schema.ts",
    out: "./src/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
