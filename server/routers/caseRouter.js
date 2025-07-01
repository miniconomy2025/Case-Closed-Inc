import express from "express";
import { getCases, getCase } from "../controllers/caseController.js";
import { getCaseByNameSchema } from "../schemas/caseSchemas.js";
import validateMiddleware, { PROPERTIES } from "../middlewares/validationMiddleware.js";

export const caseRouter = express.Router();

caseRouter.get("/", getCases);
caseRouter.get("/:name", validateMiddleware(getCaseByNameSchema, PROPERTIES.PARAMS), getCase);
