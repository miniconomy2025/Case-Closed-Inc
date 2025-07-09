import express from 'express';
import { handleMachineFailure } from '../controllers/machineController.js';

const router = express.Router();

router.post('/failure', handleMachineFailure);

export default router;