import express from 'express';
import { handleSimulationStart } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', handleSimulationStart);

export default router;