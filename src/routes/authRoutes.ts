import express from 'express';
import authController from '../controllers/auth';

const router = express.Router();

router.post('/signup', authController.signup);
// router.post('/signin', )
router.post('/otp/phone', authController.getOtp);
// router.post('/otp/email', authController.getOtpEmail);
// router.post('/otp/verify', authController.verifyOtp);

export default router;