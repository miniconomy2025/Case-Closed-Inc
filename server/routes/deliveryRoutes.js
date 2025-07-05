import express from 'express';
import { handleDelivery } from '../controllers/deliveryController.js';

const router = express.Router();

router.post('/:id', handleDelivery);

export default router;