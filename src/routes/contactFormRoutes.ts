import express from 'express';
import contactFormController from '../controllers/ContactForm';
import { createContactFormValidationSchema } from '../validations/contactForm';
import { validateAsSchema } from '../middlewares/validation';

const router = express.Router();

router.post('/create-contact-form', validateAsSchema(createContactFormValidationSchema), contactFormController.createContactForm);
export default router;