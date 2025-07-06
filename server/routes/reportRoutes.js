import express from 'express';
import { 
    getBalance,
    getStock, 
    getOrders, 
    getShipments,
    getTransactions,
    getCases,
    getSales
} from '../controllers/reportConroller.js'

const router = express.Router();

router.get('/bank/balance', getBalance);
router.get('/bank/transactions', getTransactions);
router.get('/logistics/shipments', getShipments);
router.get('/orders', getOrders);
router.get('/stock', getStock);
router.get('/cases', getCases);
router.get('/sales', getSales)
export default router;