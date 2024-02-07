import express from 'express';
import { Protect } from '../middlewares/auth';
import { optionalProtect } from '../middlewares/optionalAuth';
import { getLectureContentByLectureId, getTheoryCourseById, getTheoryCourseBySubject, getTheoryCourseFreeLectures, getTheoryCourseLectures } from '../controllers/theory';


const router = express.Router();

router.get('/subject/:subject', optionalProtect, getTheoryCourseBySubject );
router.get('/course-details', optionalProtect, getTheoryCourseById);
router.get('/free-lectures/:course_id', Protect, getTheoryCourseFreeLectures );
router.get('/lectures/:course_id', Protect, getTheoryCourseLectures);
router.get('/lecture-content/:course_id/:lecture_id', Protect, getLectureContentByLectureId ); 

export default router;  