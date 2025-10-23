import express from 'express';
import { handleSimulationStart,  handleSimulationEnd, resumeSimulation} from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', handleSimulationStart);
router.post('/resume', resumeSimulation);
router.delete('/', handleSimulationEnd);

export default router;