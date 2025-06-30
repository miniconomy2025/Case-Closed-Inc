import express from "express";

import { getBalance, getMaterials, getTransactions} from "../controllers/reportConroller.js"
import validateMiddleware, { PROPERTIES } from "../middlewares/validationMiddleware.js";

export const reportRouter = express.Router();

reportRouter.get("/balance", getBalance);
reportRouter.get("/transactions", getTransactions);
reportRouter.get("/materials", getMaterials);
