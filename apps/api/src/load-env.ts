import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

const directory = dirname(fileURLToPath(import.meta.url))

// The root file is the monorepo default; an app-local file can add local overrides.
config({ path: resolve(directory, "../../../.env") })
config()
