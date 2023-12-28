import express from 'express';
import { getTestDetailsById, getTestListTypeWise } from '../controllers/test';
import { Protect } from '../middlewares/auth';

const router = express.Router();

router.get('/test-list', getTestListTypeWise)
router.get('/test-details/:id', getTestDetailsById);

export default router;