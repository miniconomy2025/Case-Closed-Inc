import express from 'express';
import { getCases, getCase } from '../controllers/caseController.js';
import { getCaseByNameSchema } from '../schemas/caseSchemas.js';
import validateMiddleware, { PROPERTIES } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/', getCases);
router.get('/:name', validateMiddleware(getCaseByNameSchema, PROPERTIES.PARAMS), getCase);

export default router;