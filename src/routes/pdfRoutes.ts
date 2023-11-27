import express from 'express';
import { getPdfByQuestion, getPdfBySubject, getPdfPage, getpdfSolution } from '../controllers/pdf';
import { Protect } from '../middlewares/auth';


const router = express.Router();

router.get('/subject/:subject', getPdfBySubject );
router.get('/pdf', Protect, getPdfPage );
router.get('/solution', Protect, getpdfSolution );
router.get('/individual-solution', Protect, getPdfByQuestion );

export default router;  