import express from 'express';
import { getCaseOrder, postCaseOrder, markOrderPaid, markOrderPickedUp, cancelUnpaidOrder } from '../controllers/caseOrderController.js';
import { allowCompany } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:id', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'sumsang-phones-api.projects.bbdgrad.com', 'pear-company-api.projects.bbdgrad.com']), getCaseOrder);
router.delete('/:id', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'sumsang-phones-api.projects.bbdgrad.com', 'pear-company-api.projects.bbdgrad.com']), cancelUnpaidOrder);
router.post('/', postCaseOrder);

// just for testing in the interim
router.post('/:id/paid', markOrderPaid);
router.post('/:id/picked-up', markOrderPickedUp);

export default router;