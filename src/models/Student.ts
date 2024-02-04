import mongoose, { Schema, Document, Model} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

//typescript types

export interface ProductsPurchasedType {
    product_id: Schema.Types.ObjectId;
    product_type: String;
    validity: Date;
}
export interface IStudentInput {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    phone_verified: boolean;
    email_verified: boolean;
}


export interface IStudent extends IStudentInput,Document {
    OtpAttemptCount: string;
    lastOtpRequestTime: Date;
    testAttempts: Schema.Types.ObjectId[];
    products_purchased: ProductsPurchasedType[];
}

interface IStudentMethods {
    fullName(): string;
    comparePassword(userPassword:string): Promise<boolean>;
    generateAuthToken(): Promise<string>;
}

export  type StudentModel = Model<IStudent, {}, IStudentMethods>;

//schema
const StudentSchema = new Schema<IStudent, StudentModel, IStudentMethods>({
    first_name: {
        type: String,
        required: [true, 'please enter first name']
    },
    last_name: {
        type: String,
        required: [true, 'please enter first name']
    },
    email: {
        type: String,
        required: [true, 'Please enter the email'],
        validate : {
            validator: function(v:string) {
                return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v);
            },
            message: 'Invalid Email!'
        }
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        validate: {
          validator: function(v:string) {
            // return /d{10}/.test(v);
            return /^[1-9]\d{9}$/.test(v);
          },
          message: 'Invalid Phone Number!'
        }
    },
    phone_verified: {
        type: Boolean,
        default: false
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: [true, 'Please provide a password']
    },
    OtpAttemptCount: {
        type: String,
        default: '0'
    },
    lastOtpRequestTime: {
        type: Date
    },
    testAttempts:{
        type: [Schema.Types.ObjectId],
        ref: 'TestAttempt'
    },
    products_purchased: [
        {
            product_id:{
                type: Schema.Types.ObjectId
            },
            product_type:{
                type: String,
                enum: ['pyq','theory']
            },
            validity: {
                type: Date
            },
        }
    ]
}, {timestamps: true})


//                                       instance Methods
StudentSchema.method('fullName', function fullName():string {
    return this.first_name + ' ' + this.last_name;
});

//comparing the password by bcrypt
StudentSchema.method('comparePassword', async function(userPassword) {
    const isMatch = await bcrypt.compare(userPassword,this.password);
    return isMatch;
});

//creating token
StudentSchema.method('generateAuthToken', async function() {
    const token = jwt.sign({userId:this._id,username:this.fullName()},process.env.JWT_SECRET,{expiresIn:process.env.JWT_LIFETIME})
    return token
});


//                                                  middlewares
//encryption of the password using pre mongoose middleware.
//password => pre middleware does encryption => encrypted password saved in the database.
// StudentSchema.pre('save' , async function(req,res)  {
//     const salt = await bcrypt.genSalt(10);                   
//     this.password = await bcrypt.hash(this.password,salt)   
// }) 

//                                                  model
const Student = mongoose.model<IStudent, StudentModel>('Student', StudentSchema);

//export
export default Student;