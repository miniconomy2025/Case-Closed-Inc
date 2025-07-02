import express from 'express';
import { getCaseStockInformation } from '../controllers/stockController.js';

const router = express.Router();

router.get('/', getCaseStockInformation);

export default router;