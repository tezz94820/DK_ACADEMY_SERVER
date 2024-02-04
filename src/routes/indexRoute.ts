import express from 'express';
import authRoutes from './authRoutes';
import pdfRoutes from './pdfRoutes';
import adminRoutes from './adminRoutes';
import testRoutes from './testRoutes';
import paymentRoutes from './paymentRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/pyq-pdf', pdfRoutes);
router.use('/tests', testRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);

export default router;