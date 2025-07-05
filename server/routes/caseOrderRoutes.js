import express from 'express';
import { getCaseOrder, postCaseOrder, markOrderPaid, markOrderPickedUp, cancelUnpaidOrder } from '../controllers/caseOrderController.js';
import { getCaseByIdSchema, orderCaseSchema } from '../schemas/caseOrderSchemas.js';
import validationMiddleware, { PROPERTIES } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get(
    '/:id',
    validationMiddleware(
        getCaseByIdSchema,
        PROPERTIES.PARAMS),
    getCaseOrder
);

router.delete(
    '/:id',
    validationMiddleware(
        getCaseByIdSchema, 
        PROPERTIES.PARAMS),
    cancelUnpaidOrder
);

router.post(
    '/',
    validationMiddleware(
        orderCaseSchema, 
        PROPERTIES.BODY),
    postCaseOrder
);

// just for testing in the interim
router.post('/:id/paid', markOrderPaid);
router.post('/:id/picked-up', markOrderPickedUp);

export default router;