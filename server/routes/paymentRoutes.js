import express from 'express';
import { handlePayment } from '../controllers/paymentController.js';
import { allowCompany } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'commercial-bank-api.projects.bbdgrad.com']), handlePayment);
// router.post('/', handlePayment);

export default router;