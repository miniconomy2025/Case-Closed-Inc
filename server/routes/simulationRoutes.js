import express from 'express';
import { handleSimulationStart,  handleSimulationEnd} from '../controllers/simulationController.js';
import { allowCompany } from '../middlewares/authMiddleware.js';

const router = express.Router();

// router.post('/', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'thoh-api.projects.bbdgrad.com']), handleSimulationStart);
router.post('/', handleSimulationStart);
router.delete('/', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'thoh-api.projects.bbdgrad.com']), handleSimulationEnd);

export default router;