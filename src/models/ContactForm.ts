import mongoose, { Schema, Document, Model} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

//typescript types

export interface IcontactForm {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    message: string;
    called: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}


//schema
const ContactFormSchema = new Schema<IcontactForm>({
    first_name: {
        type: String,
        required: [true, 'please enter first name']
    },
    last_name: {
        type: String,
        required: [true, 'please enter last name']
    },
    email: {
        type: String,
        required: [true, 'Please enter the email'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
    },
    message: {
        type: String,
        required: false
    },
    called: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})


//                                                  model
const ContactForm = mongoose.model<IcontactForm>('ContactForm', ContactFormSchema);

//export
export default ContactForm;