import express from 'express';
import signup from '../controllers/auth';
import authRoutes from './authRoutes';

const router = express.Router();

router.use('/auth', authRoutes);

export default router;