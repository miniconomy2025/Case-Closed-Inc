import express from "express";

import { getBalance, getMaterials, getOrders} from "../controllers/reportConroller.js"
import validateMiddleware, { PROPERTIES } from "../middlewares/validationMiddleware.js";

export const reportRouter = express.Router();

reportRouter.get("/balance", getBalance);
reportRouter.get("/orders", getOrders);
reportRouter.get("/materials", getMaterials);
