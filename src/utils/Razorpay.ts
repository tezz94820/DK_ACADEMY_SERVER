import Razorpay from "razorpay";
import env from 'dotenv';
env.config();


export const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});