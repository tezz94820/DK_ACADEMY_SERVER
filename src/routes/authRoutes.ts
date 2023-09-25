import express from 'express';
import authController from '../controllers/auth';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', )
export default router;