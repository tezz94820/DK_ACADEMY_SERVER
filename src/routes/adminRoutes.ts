import express from 'express';
import { createPdf, createPdfSolution, uploadSolutionContent } from '../controllers/pdf';
import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect, adminProtect } from '../middlewares/auth';
import { upload } from '../middlewares/multer';
import { createNewTest, createTestQuestions, deleteTest, editTestDetails } from '../controllers/test';
import { createTestValidationSchema } from '../validations/tests';


const router = express.Router();

const multer = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 },
])

//pyq-pdf
router.post('/pyq-pdf', Protect, validateAsSchema(createPdfValidationSchema), createPdf);
router.post('/create-pdf-solution', Protect, createPdfSolution);
router.post('/upload-solution', Protect, multer, uploadSolutionContent);

//test series
router.post('/create-test', Protect, adminProtect, validateAsSchema(createTestValidationSchema), createNewTest);
router.post('/edit-test/:id', Protect, adminProtect, editTestDetails);
router.delete('/delete-test/:id', Protect, adminProtect, deleteTest);
router.post('/create-test-questions/:id', Protect, adminProtect, createTestQuestions);



export default router;  
