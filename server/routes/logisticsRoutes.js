import express from "express";
import { handleLogistics } from "../controllers/logisticsController.js";
import { allowCompany } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", handleLogistics);

export default router;
