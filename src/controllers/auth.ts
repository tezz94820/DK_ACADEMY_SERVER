import { NextFunction, Request, Response } from "express";
import Student, { IStudent } from "../models/Student";
import catchAsync from "../utils/catchAsync";
import AppError from '../utils/AppError';
import {sendSuccess, sendError } from '../utils/ApiResponse'; 
import { checkStudentAlreadyPresent, checkStudentIsVerified, createStudent, deleteStudent } from '../services/auth'; 
import otpGenerator from 'otp-generator';
import { AddMinutesToDate } from "../utils/dateFunctions";
import Otp from "../models/Otp";
import bcrypt from 'bcrypt';
import sendOtp from "../utils/sendOtp";
import { MAX_OTP_TRIALS, MAX_OTP_TRIALS_IN_MINUTES, OTP_EXPIRE_AFTER_MINUTES } from "../constants/otp";

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

    //create a token
    // const token = await newStudent.generateAuthToken();
    // const response = {
    //     user_id: newStudent._id,
    //     name: newStudent.fullName(),
    //     token,
    // }
    const response = {};
    sendSuccess(res, 200, 'Student created successfully', response);
})



const getOtp = catchAsync(async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    
    const {phone} = req.body;
    const currentTime = new Date();

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
    if(student.lastOtpRequestTime!=undefined && currentTime > AddMinutesToDate(student.lastOtpRequestTime,MAX_OTP_TRIALS_IN_MINUTES)){
        student.OtpAttemptCount = '0';
        student.lastOtpRequestTime = undefined;
    }

    //if request is within 1 hour then check otpCount. if otpCount>3 return error.
    if( student.lastOtpRequestTime != undefined
        &&
        currentTime < AddMinutesToDate(student.lastOtpRequestTime,MAX_OTP_TRIALS_IN_MINUTES)
        && 
        parseInt(student.OtpAttemptCount) >= 3
    ){
        const response={"status":"Failure","details":"Only 3 OTP request in 1 hour"}
        return sendError(res, 400, 'Only 3 OTP request in 1 hour. Now apply after 1 hr', response);
    }

        //Generate OTP 
    const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const expiration_time = AddMinutesToDate(currentTime,OTP_EXPIRE_AFTER_MINUTES);
    
    //Create OTP instance in OTP model
    const otp_instance = new Otp({
        otp: otp,
        expiration_time: expiration_time,
        verified: false
    });
    await otp_instance.save();
    
     // Create details object containing the phone number and otp id
     const details={
         "timestamp": currentTime, 
         "check": phone,
         "success": true,
        "message":"OTP sent to user",
        "otp_id": otp_instance._id
    }
    
    // Encrypt the details object
    const encoded= await bcrypt.hash(JSON.stringify(details),10);
    
    // sendOTP by fast2way sms :- it is set but unabled it to save cost
    // const response = await sendOtp(otp,phone);
    const response = {return:true};
    if(!response.return)
        return sendError(res, 400, 'Failed to send OTP', {status:"fail"});
    
    // update the student model
    student.lastOtpRequestTime = currentTime;
    student.OtpAttemptCount = String(parseInt(student.OtpAttemptCount) + 1);
    await student.save();

    sendSuccess(res, 200, 'OTP sent Successful', response);

})




export default {signup, getOtp};
