import express from 'express';
import { Protect } from '../middlewares/auth';
import { optionalProtect } from '../middlewares/optionalAuth';
import { getProfileInfo } from '../controllers/Student';


const router = express.Router();

router.get('/profile', Protect, getProfileInfo );

export default router;  