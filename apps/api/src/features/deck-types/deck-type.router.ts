import {
    authorizationRoles,
    createDeckTypeRequestSchema,
    deckTypeIdParamsSchema,
    includeDeckTypeRequestSchema,
    includedDeckTypeParamsSchema,
    updateDeckTypeRequestSchema,
} from "@board-games/contracts"
import { Router } from "express"
import { authenticate, requireRole } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import {
    create,
    get,
    include,
    list,
    remove,
    removeIncluded,
    update,
} from "./deck-type.controller.js"

export const deckTypesRouter: Router = Router()

deckTypesRouter.use(authenticate, requireRole(authorizationRoles.administrator))
deckTypesRouter.get("/", list)
deckTypesRouter.post("/", validateRequest(createDeckTypeRequestSchema), create)
deckTypesRouter.get(
    "/:deckTypeId",
    validateRequest(deckTypeIdParamsSchema),
    get,
)
deckTypesRouter.patch(
    "/:deckTypeId",
    validateRequest(updateDeckTypeRequestSchema),
    update,
)
deckTypesRouter.delete(
    "/:deckTypeId",
    validateRequest(deckTypeIdParamsSchema),
    remove,
)
deckTypesRouter.post(
    "/:deckTypeId/included-decks",
    validateRequest(includeDeckTypeRequestSchema),
    include,
)
deckTypesRouter.delete(
    "/:deckTypeId/included-decks/:includedDeckTypeId",
    validateRequest(includedDeckTypeParamsSchema),
    removeIncluded,
)
