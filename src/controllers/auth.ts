import { NextFunction, Request, Response } from "express";
import Student, { IStudent } from "../models/Student";
import catchAsync from "../utils/catchAsync";
import AppError from '../utils/AppError';
import {sendSuccess, sendError } from '../utils/ApiResponse'; 
import { checkStudentAlreadyPresent, checkStudentIsVerified, createStudent, deleteStudent } from '../services/auth'; 

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

    const {first_name,last_name,email,phone,password} = req.body;
    
    const alreadyPresentStudent = await Student.findOne({phone:req.body.phone});

    //if already present and verified then he can directly login
    if(alreadyPresentStudent && alreadyPresentStudent.phone_verified)
        return sendError(res, 400, 'Student already present. you can login', {});
    
    //if already present but not verified then delete the already present entry
    if(alreadyPresentStudent && !alreadyPresentStudent.phone_verified){
        await Student.findByIdAndDelete(alreadyPresentStudent._id);
    }

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
    const token = await newStudent.generateAuthToken();
    const response = {
        user_id: newStudent._id,
        name: newStudent.fullName(),
        token,
    }
    res.status(200).json(response);
})


export default {signup};
