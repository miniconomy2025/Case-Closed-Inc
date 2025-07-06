import express from 'express';
import { handleSimulationEvent, handleSimulationStart } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', handleSimulationStart);
router.post('/event', handleSimulationEvent)

export default router;