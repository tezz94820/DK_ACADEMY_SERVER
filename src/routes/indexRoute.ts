import express from 'express';
import signup from '../controllers/auth';
import authRoutes from './authRoutes';
import pdfRoutes from './pdfRoutes';
import adminRoutes from './adminRoutes';
import testRoutes from './testRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/pyq-pdf', pdfRoutes);
router.use('/tests', testRoutes);
router.use('/admin', adminRoutes);


export default router;