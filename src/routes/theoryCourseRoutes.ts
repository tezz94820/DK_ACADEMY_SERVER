import express from 'express';
import { Protect } from '../middlewares/auth';
import { optionalProtect } from '../middlewares/optionalAuth';
import { getTheoryCourseById, getTheoryCourseBySubject, getTheoryCourseLectures } from '../controllers/theory';


const router = express.Router();

router.get('/subject/:subject', optionalProtect, getTheoryCourseBySubject );
router.get('/course-details', getTheoryCourseById);
router.get('/lectures/:course_id', Protect, getTheoryCourseLectures);
// router.get('/solution', Protect, getpdfSolution );
// router.get('/free-solution', Protect, getpdfFreeSolution)
// router.get('/individual-solution', Protect, getPdfSolutionByQuestion );

export default router;  