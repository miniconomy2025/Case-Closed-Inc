import express from 'express';
import { handleLogistics } from '../controllers/logisticsController.js';

const router = express.Router();

router.post('/', handleLogistics);

export default router;