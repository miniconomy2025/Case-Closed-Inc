import express from 'express';
import { handleLogistics } from '../controllers/logisticsController.js';
import { allowCompany } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'bulk-logistics-api.projects.bbdgrad.com']), handleLogistics);

export default router;