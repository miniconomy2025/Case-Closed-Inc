import express from 'express';
import { getCaseOrder, postCaseOrder, markOrderPaid, markOrderPickedUp } from '../controllers/caseOrderController.js';

const router = express.Router();

router.get('/:id', getCaseOrder);
router.post('/', postCaseOrder);

// just for testing in the interim
router.post('/:id/paid', markOrderPaid);
router.post('/:id/picked-up', markOrderPickedUp);

export default router;