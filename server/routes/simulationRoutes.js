import express from 'express';
import { handleSimulationStart,  handleSimulationEnd} from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', handleSimulationStart);
router.delete('/', handleSimulationEnd);

export default router;