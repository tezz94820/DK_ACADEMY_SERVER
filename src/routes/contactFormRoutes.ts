import express from 'express';
import {createContactForm} from '../controllers/contactForm';
import { createContactFormValidationSchema } from '../validations/contactForm';
import { validateAsSchema } from '../middlewares/validation';

const router = express.Router();

router.post('/create-contact-form', validateAsSchema(createContactFormValidationSchema), createContactForm);
export default router;