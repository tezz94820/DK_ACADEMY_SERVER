import express from 'express';
import { createPdf, createPdfSolution, uploadSolutionContent } from '../controllers/pdf';
import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect } from '../middlewares/auth';
import { upload } from '../middlewares/multer';
import { createNewTest, createTestQuestions } from '../controllers/test';
import { createTestValidationSchema } from '../validations/tests';


const router = express.Router();

const multer = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 },
])

router.post('/pyq-pdf', Protect, validateAsSchema(createPdfValidationSchema), createPdf);
router.post('/create-pdf-solution', Protect, createPdfSolution);
router.post('/upload-solution', Protect, multer, uploadSolutionContent);
router.post('/create-test', Protect, validateAsSchema(createTestValidationSchema), createNewTest);
router.post('/create-test-questions/:id', Protect, createTestQuestions);



export default router;  
