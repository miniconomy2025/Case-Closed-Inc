import express from 'express';
import collectionRoutes from './collectionRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import simulationRoutes from './simulationRoutes.js';
import reportRoutes from './reportRoutes.js';
import caseRoutes from './caseRoutes.js';
import caseOrderRouter from './caseOrderRoutes.js'

const router = express.Router();

router.use('/collection', collectionRoutes);
router.use('/dropoff', deliveryRoutes);
router.use('/simulation', simulationRoutes);
router.use('/reports', reportRoutes);
router.use('/cases', caseRoutes);
router.use('/orders', caseOrderRouter);

export default router;