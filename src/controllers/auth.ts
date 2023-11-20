import { NextFunction, Request, Response } from "express";
import Student, { IStudent } from "../models/Student";
import catchAsync from "../utils/catchAsync";
import {sendSuccess, sendError } from '../utils/ApiResponse'; 
import otpGenerator from 'otp-generator';
import { AddMinutesToDate } from "../utils/dateFunctions";
import Otp from "../models/Otp";
import bcrypt from 'bcrypt';
import sendOtp from "../utils/sendOtp";
import { MAX_OTP_TRIALS, MAX_OTP_TRIALS_IN_MINUTES, OTP_EXPIRE_AFTER_MINUTES } from "../constants/otp";
import { decode, encode } from "../utils/crypt";
import { emailOrPhoneNumber } from "../services/auth";
import { registerValidationSchema } from '../validations/auth'

const register = catchAsync(async (req:Request,res:Response):Promise<void> => {
    
    let {first_name,last_name,email,phone,password} = req.body;
    
    const alreadyPresentStudent = await Student.findOne({phone});

    //if already present and verified then he can directly login
    if(alreadyPresentStudent && alreadyPresentStudent.phone_verified)
        return sendSuccess(res, 400, 'You Are already registered. you can login', {});
    
    //if already present but not verified then delete the already present entry
    if(alreadyPresentStudent && !alreadyPresentStudent.phone_verified){
        await Student.findByIdAndDelete(alreadyPresentStudent._id);
    }

    //encryt the password
    const salt = await bcrypt.genSalt(10);                   
    password = await bcrypt.hash(password,salt);

    //create new Student
    const newStudent = await Student.create({
        first_name,
        last_name,
        email,
        phone,
        password,
        phone_verified: false,
        email_verified: false
    });

    const response = {phone};
    sendSuccess(res, 200, 'Student created successfully', response);
})



const getOtp = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    
    const {phone} = req.body;
    const currentDate = new Date();

    const student = await Student.findOne({phone:phone});
    
    if(!student){
      const response={"status":"Failure","details":"Student not found"}
      return sendError(res, 400, 'Student not found', response); 
    }

    // when 1 hour has passed then reset the otp properties 
    if(student.lastOtpRequestTime!=undefined && currentDate > AddMinutesToDate(student.lastOtpRequestTime,MAX_OTP_TRIALS_IN_MINUTES)){
        student.OtpAttemptCount = '0';
        student.lastOtpRequestTime = undefined;
    }

    //if request is within 1 hour then check otpCount. if otpCount>3 return error.
    if( student.lastOtpRequestTime != undefined
        &&
        currentDate < AddMinutesToDate(student.lastOtpRequestTime,MAX_OTP_TRIALS_IN_MINUTES)
        && 
        parseInt(student.OtpAttemptCount) >= MAX_OTP_TRIALS
    ){
        const response={"status":"Failure","details":"Only 3 OTP request in 1 hour"}
        return sendError(res, 400, 'Only 3 OTP request in 1 hour. Now apply after 1 hr', response);
    }

    //Generate OTP 
    const otp = otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const expiration_time = AddMinutesToDate(currentDate,OTP_EXPIRE_AFTER_MINUTES);
    
    //Create OTP instance in OTP model
    const otp_instance = new Otp({
        otp: otp,
        expiration_time: expiration_time,
    });
    await otp_instance.save();
    
     // Create details object containing the phone number and otp id
     const details={
        "timestamp": currentDate, 
        "check": phone,
        "success": true,
        "message":"OTP sent to user",
        "otp_id": otp_instance._id
    }
    
    // Encrypt the details object
    const encoded = await encode(JSON.stringify(details));
    
    // sendOTP by fast2way sms :- it is set but unabled it to save cost
    if(process.env.NODE_ENV === 'production'){
        const sendDetails = await sendOtp(otp,phone);
        
        if(!sendDetails.return)
            return sendError(res, 400, 'Failed to send OTP', {status:"fail"});
    }
    
    const response = {
            verification_code:encoded
    }

    // update the student model
    student.lastOtpRequestTime = currentDate;
    student.OtpAttemptCount = String(parseInt(student.OtpAttemptCount) + 1);
    await student.save();

    return sendSuccess(res, 200, 'OTP sent Successful', response);

})



const verifyOtp = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    
    const {verification_code, otp, check, type} = req.body;
    const currentDate = new Date(); 
    //type :- FORGOT,REGISTER

    //Check if verification code is altered or not
    let decoded:string;
    try {
        decoded = await decode(verification_code);
    } catch (error) {
        return sendError(res, 400, 'Verification code not valid', {message:"Verification code not valid"});
    }
        
    const decodedObj = JSON.parse(decoded);

    // Check if the OTP was meant for the same email or phone number for which it is being verified 
    if(decodedObj.check!=check){
      const errorData={"Status":"Failure", "Details": "OTP was not sent to this particular email or phone number"}
      return sendError(res, 400, 'OTP was not sent to this particular email or phone number', errorData);
    }

    const otp_instance = await Otp.findById(decodedObj.otp_id);
    
    // if otp is not present in db
    if(!otp_instance)
        return sendError(res, 400, 'Otp is expired', {message:"Otp is expired"});
    
    // if otp is expired
    if(otp_instance.expiration_time < currentDate)
        return sendError(res, 400, 'Otp is expired', {message:"Otp is expired"});

    //Check if OTP is equal to the OTP in the DB
    if(otp!=otp_instance.otp)
        return sendError(res, 400, 'Incorrect OTP', {message:"Incorrect OTP"});

    //so if the otp matches delete the OTP from db
    await Otp.findByIdAndDelete(decodedObj.otp_id);
    
    // if register then 
    let response = {};
    if(type === 'REGISTER'){
        //  update phone_verified of that student to true
        const student = await Student.findOneAndUpdate({phone:check},{phone_verified:true});
        if(!student)
            return sendError(res, 400, 'Student not found with this phone number', {message:"Student not found with this phone number"});
        
        // create a token
        const token = await student.generateAuthToken();
        response = {
            otp_verified:true,
            user_id: student._id,
            name: student.fullName(),
            token,
            phone:check  
        }
    }
    else if(type === 'FORGOT'){
        response = {
            otp_verified:true,
            phone:check  
        }
    }

    return sendSuccess(res, 200, 'OTP verified', response);
})


const login = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    //user_contact can be email/phone
    const { user_contact:userContact, password } = req.body;

    //getting the type of user_contact either email or phone or invalid
    const type = await emailOrPhoneNumber(userContact);

    if(type === 'invalid')
        return sendError(res, 400, 'Invalid User Contact', {});

    //get the student from db
    let student;
    if(type === 'phone'){
        student = await Student.findOne({phone:userContact});
        if(!student)
            return sendError(res, 400, 'Phone is not registered', {});
    }
    
    if(type === 'email'){
        student = await Student.findOne({email:userContact});
        if(!student)
            return sendError(res, 400, 'Email is not registered', {});
    }

    //check the password is correct
    const isMatch = await student.comparePassword(password);
    if(!isMatch)
        return sendError(res, 400, 'Invalid Password', {});

    //check the phone is verified
    if(!student.phone_verified)
        return sendError(res, 400, 'Phone is not verified', {});
    
    //create a token
    const token = await student.generateAuthToken();
    const response = {
        user_id: student._id,
        name: student.fullName(),
        token,
        phone:student.phone
    }

    return sendSuccess(res, 200, 'Login Successful', response);
})


const changePassword = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    //user_contact can be email/phone
    const { phone, new_password:newPassword } = req.body;

    if(!phone)
        return sendError(res, 400, 'Phone number not provided', {});

    if(!newPassword)
        return sendError(res, 400, 'New Password not provided', {});

    //encryt the new password and 
    const salt = await bcrypt.genSalt(10);                   
    const hashedPassword = await bcrypt.hash(newPassword,salt);
    
    // find the stduent by phone number and update the password with new hashedPassword
    const student = await Student.findOneAndUpdate( {phone}, {$set:{password:hashedPassword}}, {new:true});
    if(!student)
        return sendError(res, 400, 'Student not found', {});
    
    const response = {
        check:phone,
        success:true,
        message:"Password changed successfully"        
    }

    return sendSuccess(res, 200, 'Password changed Successfully', response);
})

export default {register, getOtp, verifyOtp, login, changePassword};
