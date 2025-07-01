import express from 'express';
import { handleSimulationStart } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/simulation', handleSimulationStart);

export default router;