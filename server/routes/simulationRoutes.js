import express from 'express';
import { handleSimulationEvent, handleSimulationStart,  handleSimulationEnd} from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', handleSimulationStart);
router.post('/end', handleSimulationEnd);
router.post('/event', handleSimulationEvent)

export default router;