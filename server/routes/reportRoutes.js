import express from 'express';
import { 
    getBalance,
    getMaterials, 
    getOrders, 
    getShipments,
    getTransactions,
    getCases
} from '../controllers/reportConroller.js'

const router = express.Router();

router.get('/bank/balance', getBalance);
router.get('/bank/transactions', getTransactions);
router.get('/logistics/shipments', getShipments);
router.get('/orders', getOrders);
router.get('/materials', getMaterials);
router.get('/cases', getCases);

export default router;