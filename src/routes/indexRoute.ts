import express from 'express';
import authRoutes from './authRoutes';
import pyqCourseRoutes from './pdfRoutes';
import adminRoutes from './adminRoutes';
import testRoutes from './testRoutes';
import paymentRoutes from './paymentRoutes';
import theoryCourseRoutes from './theoryCourseRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/pyq-pdf', pyqCourseRoutes);
router.use('/tests', testRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);
router.use('/theory', theoryCourseRoutes);

export default router;