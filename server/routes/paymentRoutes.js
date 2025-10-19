import express from 'express';
import { handlePayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/', handlePayment);
// router.post('/', handlePayment);

export default router;