import {
    bootstrapSetupRequestSchema,
    loginRequestSchema,
} from "@board-games/contracts"
import { Router } from "express"
import { validateRequest } from "../../middleware/validate-request.js"
import { logIn, logOut, me, refresh, setup, status } from "./auth.controller.js"

export const authRouter: Router = Router()

authRouter.get("/status", status)
authRouter.post("/setup", validateRequest(bootstrapSetupRequestSchema), setup)
authRouter.post("/login", validateRequest(loginRequestSchema), logIn)
authRouter.post("/refresh", refresh)
authRouter.post("/logout", logOut)
authRouter.get("/me", me)
