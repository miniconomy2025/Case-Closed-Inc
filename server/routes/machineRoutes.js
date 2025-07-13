import express from 'express';
import { handleMachineFailure } from '../controllers/machineController.js';
import { allowCompany } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/failure', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'thoh-api.projects.bbdgrad.com']),  handleMachineFailure);

export default router;