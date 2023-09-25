import mongoose, { Schema, Document, Model  } from 'mongoose';
import { Request, Response } from 'express';

//typescript types
export interface IOtp extends Document {
    otp: string;
    expiration_time: Date;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

//schema
const OtpSchema = new Schema<IOtp>({
    otp: {
        type: String,
        required: [true, 'please enter OTP']
    },
    expiration_time: {
        type: Date,
        required: [true, 'please enter OTP expiration time']
    },
    verified: {
        type: Boolean,
        required: [true, 'please enter OTP Verified']
    },
}, {timestamps: true})


//                                                  model
const Otp = mongoose.model<IOtp>('Otp', OtpSchema);

//export
export default Otp;