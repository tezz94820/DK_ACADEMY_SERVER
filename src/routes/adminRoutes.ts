import express from 'express';
import { addPdfSolution, createPdf, createPdfSolution, deletePdfSolution, deletePyqPdf, editPyqPdf, getSolutionsWithCheck, uploadPyqPdf } from '../controllers/pdf';
import { validateAsSchema } from '../middlewares/validation';
import { createPdfValidationSchema } from '../validations/pdf';
import { Protect, adminProtect } from '../middlewares/auth';
import { upload } from '../middlewares/multer';
import { createNewTest, createTestQuestions, deleteTest, editTestDetails } from '../controllers/test';
import { createTestValidationSchema } from '../validations/tests';


const router = express.Router();

//pyq-pdf
router.post('/create-pyq-pdf', Protect, adminProtect, validateAsSchema(createPdfValidationSchema), createPdf);
router.post('/edit-pyq-pdf/:pdf_id', Protect, adminProtect, editPyqPdf);
router.delete('/delete-pyq-pdf/:pdf_id', Protect, adminProtect, deletePyqPdf);
router.get('/upload-pyq-pdf/:pdf_id', Protect, adminProtect, uploadPyqPdf);
router.get('/solutions-with-check/:pdf_id', Protect, adminProtect, getSolutionsWithCheck);
router.post('/create-pdf-solution/:pdf_id', Protect, createPdfSolution);
router.get('/add-pdf-solution/:pdf_id', Protect, addPdfSolution);
router.delete('/delete-pdf-solution/:pdf_id', Protect, deletePdfSolution);

//test series
router.post('/create-test', Protect, adminProtect, validateAsSchema(createTestValidationSchema), createNewTest);
router.post('/edit-test/:id', Protect, adminProtect, editTestDetails);
router.delete('/delete-test/:id', Protect, adminProtect, deleteTest);
router.post('/create-test-questions/:id', Protect, adminProtect, createTestQuestions);



export default router;  
