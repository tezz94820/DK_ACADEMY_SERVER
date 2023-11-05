import express from 'express';
import authController from '../controllers/auth';
import { registerValidationSchema, getOtpValidationSchema, verifyOtpValidationSchema, loginValidationSchema } from '../validations/auth';
import { validateAsSchema } from '../middlewares/validation';

const router = express.Router();

router.post('/register', validateAsSchema(registerValidationSchema), authController.register);
router.post('/login', validateAsSchema(loginValidationSchema), authController.login);
router.post('/otp/phone', validateAsSchema(getOtpValidationSchema), authController.getOtp);
// router.post('/otp/email', authController.getOtpEmail);
router.post('/otp/verify', validateAsSchema(verifyOtpValidationSchema), authController.verifyOtp);
router.post('/changepassword', authController.changePassword);



export default router;