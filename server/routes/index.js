import express from 'express';
import logisticsRoutes from './logisticsRoutes.js';
import simulationRoutes from './simulationRoutes.js';
import machineRoutes from './machineRoutes.js';
import reportRoutes from './reportRoutes.js';
import caseRoutes from './caseRoutes.js';
import caseOrderRouter from './caseOrderRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = express.Router();

router.use('/logistics', logisticsRoutes);
router.use('/simulation', simulationRoutes);
router.use('/machines', machineRoutes);
router.use('/reports', reportRoutes);
router.use('/cases', caseRoutes);
router.use('/orders', caseOrderRouter);
router.use('/payment', paymentRoutes);

export default router;