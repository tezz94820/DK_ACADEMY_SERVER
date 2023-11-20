import express from 'express';
import { createPdf } from '../controllers/pdf';

import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect } from '../middlewares/auth';

const router = express.Router();

router.post('/pyq-pdf', Protect, validateAsSchema(createPdfValidationSchema), createPdf);

export default router;  
