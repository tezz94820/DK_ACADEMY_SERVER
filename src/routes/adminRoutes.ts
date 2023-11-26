import express from 'express';
import { createPdf, createPdfSolution } from '../controllers/pdf';

import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect } from '../middlewares/auth';

const router = express.Router();

router.post('/pyq-pdf', Protect, validateAsSchema(createPdfValidationSchema), createPdf);
router.post('/create-pdf-solution', Protect, createPdfSolution);

export default router;  
