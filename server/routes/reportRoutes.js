import express from 'express';
import { getBalance, getMaterials, getOrders} from '../controllers/reportConroller.js'

const router = express.Router();

router.get('/balance', getBalance);
router.get('/orders', getOrders);
router.get('/materials', getMaterials);

export default router;