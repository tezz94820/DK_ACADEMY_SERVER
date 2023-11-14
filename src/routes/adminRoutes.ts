import express from 'express';
import { createPdf } from '../controllers/pdf';

import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';

const router = express.Router();

router.post('/pyq-pdf', validateAsSchema(createPdfValidationSchema), createPdf);

export default router;  
