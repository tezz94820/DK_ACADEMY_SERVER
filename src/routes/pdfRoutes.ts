import express from 'express';
import { getPdfBySubject, getPdfPage, getpdfSolution } from '../controllers/pdf';
import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect } from '../middlewares/auth';


const router = express.Router();

router.get('/subject/:subject', getPdfBySubject );
router.get('/pdf', Protect, getPdfPage );
router.get('/solution', Protect, getpdfSolution );


export default router;  