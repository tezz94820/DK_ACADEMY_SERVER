import express from 'express';
import { createPdf, getPdfBySubject } from '../controllers/pdf';
import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';

const router = express.Router();

router.get('/subject/:subject', getPdfBySubject);

export default router;  