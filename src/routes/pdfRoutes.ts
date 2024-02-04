import express from 'express';
import { getPdfSolutionByQuestion, getPdfBySubject, getPdfPage, getpdfSolution, getPyqCourseById, getFreePdfPage, getpdfFreeSolution, } from '../controllers/pdf';
import { Protect } from '../middlewares/auth';
import { optionalProtect } from '../middlewares/optionalAuth';


const router = express.Router();

router.get('/subject/:subject', optionalProtect, getPdfBySubject );
router.get('/course-details', getPyqCourseById);
router.get('/pdf/:pdf_id', Protect, getPdfPage );
router.get('/access-free-pdf/:pdf_id', Protect, getFreePdfPage);
router.get('/solution', Protect, getpdfSolution );
router.get('/free-solution', Protect, getpdfFreeSolution)
router.get('/individual-solution', Protect, getPdfSolutionByQuestion );

export default router;  