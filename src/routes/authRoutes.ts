import express from 'express';
import authController from '../controllers/auth';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/otp/phone', authController.getOtp);
// router.post('/otp/email', authController.getOtpEmail);
router.post('/otp/verify', authController.verifyOtp);
router.post('/changepassword', authController.changePassword);



export default router;