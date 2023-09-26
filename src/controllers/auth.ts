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

const signup = catchAsync(async (req:Request,res:Response):Promise<void> => {
    
    if (!req.body.first_name) {
        return sendError(res, 400, 'Please provide your first name', {});
    }
    
    if (!req.body.last_name) {
        return sendError(res, 400, 'Please provide your last name', {});
    }

    if (!req.body.email) {
        return sendError(res, 400, 'Please provide your email', {});
    }

    if (!req.body.phone) {
        return sendError(res, 400, 'Please provide your phone number', {});
    }

    if (!req.body.password) {
        return sendError(res, 400, 'Please provide your password', {});
    }

    let {first_name,last_name,email,phone,password} = req.body;
    
    const alreadyPresentStudent = await Student.findOne({phone:req.body.phone});

    //if already present and verified then he can directly login
    if(alreadyPresentStudent && alreadyPresentStudent.phone_verified)
        return sendError(res, 400, 'Student already present. you can login', {});
    
    //if already present but not verified then delete the already present entry
    if(alreadyPresentStudent && !alreadyPresentStudent.phone_verified){
        await Student.findByIdAndDelete(alreadyPresentStudent._id);
    }

    //encryt the password
    const salt = await bcrypt.genSalt(10);                   
    password = await bcrypt.hash(password,salt);

    //create new Student
    const newStudent = new Student({
        first_name,
        last_name,
        email,
        phone,
        password,
        phone_verified: false,
        email_verified: false
    });
    await newStudent.validate();
    await newStudent.save();

    
    const response = {};
    sendSuccess(res, 200, 'Student created successfully', response);
})



const getOtp = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    
    const {phone} = req.body;
    const currentDate = new Date();

    if(!phone){
      const response={"status":"Failure","details":"Phone Number not provided"}
      return sendError(res, 400, 'Phone Number not provided', response); 
    }
    
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
    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
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
    
    // // sendOTP by fast2way sms :- it is set but unabled it to save cost
    // const sendDetails = await sendOtp(otp,phone);
    
    // if(!sendDetails.return)
    //     return sendError(res, 400, 'Failed to send OTP', {status:"fail"});
    
    const response = {
            verification_code:encoded
    }

    // update the student model
    student.lastOtpRequestTime = currentDate;
    student.OtpAttemptCount = String(parseInt(student.OtpAttemptCount) + 1);
    await student.save();

    sendSuccess(res, 200, 'OTP sent Successful', response);

})



const verifyOtp = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    
    const currentDate = new Date(); 
    const {verification_code, otp, check} = req.body;

    if(!verification_code){
      const response={"Status":"Failure","Details":"Verification Key not provided"}
      return sendError(res, 400, 'Verification code not provided', response); 
    }
    if(!otp){
      const response={"Status":"Failure","Details":"OTP not Provided"}
      return sendError(res, 400, 'Otp not provided', response); 
    }

    if(!check){
      const response={"Status":"Failure","Details":"phone number not provided"}
      return sendError(res, 400, 'phone number not provided', response);
    }

    //Check if verification key is altered or not
    let decoded:string;
    try {
        decoded = await decode(verification_code);
    } catch (error) {
        return sendError(res, 400, 'Verification code not valid', {});
    }
        
    const decodedObj = JSON.parse(decoded);

    // Check if the OTP was meant for the same email or phone number for which it is being verified 
    if(decodedObj.check!=check){
      const response={"Status":"Failure", "Details": "OTP was not sent to this particular email or phone number"}
      return sendError(res, 400, 'OTP was not sent to this particular email or phone number', response);
    }

    const otp_instance = await Otp.findById(decodedObj.otp_id);
    
    // if otp is not present in db
    if(!otp_instance)
        return sendError(res, 400, 'Otp is expired', {});
    
    // if otp is expired
    if(otp_instance.expiration_time < currentDate)
        return sendError(res, 400, 'Otp is expired', {});

    //Check if OTP is equal to the OTP in the DB
    if(otp!=otp_instance.otp)
        return sendError(res, 400, 'Incorrect OTP', {});

    const student = await Student.findOne({phone:check});

    if(!student)
        return sendError(res, 400, 'Student not found with this phone number', {});

    student.phone_verified = true;
    await student.save();
    // create a token
    const token = await student.generateAuthToken();
    const response = {
        otp_verified:true,
        user_id: student._id,
        name: student.fullName(),
        token,
        phone:check  
    }

    return sendSuccess(res, 200, 'OTP verified', response);
})



export default {signup, getOtp, verifyOtp};
