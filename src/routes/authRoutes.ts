import express from 'express';
import authController from '../controllers/auth';

const router = express.Router();

router.get('/signup', authController.signup);

export default router;