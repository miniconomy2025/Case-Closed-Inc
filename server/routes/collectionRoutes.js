import express from 'express';
import { handleCollection } from '../controllers/collectionController.js';

const router = express.Router();

router.post('/:id', handleCollection);

export default router;