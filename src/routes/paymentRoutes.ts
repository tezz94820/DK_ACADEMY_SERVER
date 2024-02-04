import express from 'express';
import { createPaymentOrder, verifyPaymentOrder } from '../controllers/payment';
import { Protect } from '../middlewares/auth';

const router = express.Router();

router.post('/create-order',Protect, createPaymentOrder);
router.post('/verify-payment', verifyPaymentOrder);


export default router;