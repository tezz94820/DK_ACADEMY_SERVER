"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Student_1 = __importDefault(require("../models/Student"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const ApiResponse_1 = require("../utils/ApiResponse");
const otp_generator_1 = __importDefault(require("otp-generator"));
const dateFunctions_1 = require("../utils/dateFunctions");
const Otp_1 = __importDefault(require("../models/Otp"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendOtp_1 = __importDefault(require("../utils/sendOtp"));
const otp_1 = require("../constants/otp");
const crypt_1 = require("../utils/crypt");
const auth_1 = require("../services/auth");
const register = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { first_name, last_name, email, phone, password } = req.body;
    const alreadyPresentStudent = yield Student_1.default.findOne({ phone });
    //if already present and verified then he can directly login
    if (alreadyPresentStudent && alreadyPresentStudent.phone_verified)
        return (0, ApiResponse_1.sendSuccess)(res, 400, 'You Are already registered. you can login', {});
    //if already present but not verified then delete the already present entry
    if (alreadyPresentStudent && !alreadyPresentStudent.phone_verified) {
        yield Student_1.default.findByIdAndDelete(alreadyPresentStudent._id);
    }
    //encryt the password
    const salt = yield bcrypt_1.default.genSalt(10);
    password = yield bcrypt_1.default.hash(password, salt);
    //create new Student
    const newStudent = yield Student_1.default.create({
        first_name,
        last_name,
        email,
        phone,
        password,
        phone_verified: false,
        email_verified: false
    });
    const response = { phone };
    (0, ApiResponse_1.sendSuccess)(res, 200, 'Student created successfully', response);
}));
const getOtp = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    const currentDate = new Date();
    const student = yield Student_1.default.findOne({ phone: phone });
    if (!student) {
        const response = { "status": "Failure", "details": "Student not found" };
        return (0, ApiResponse_1.sendError)(res, 400, 'Student not found', response);
    }
    // when 1 hour has passed then reset the otp properties 
    if (student.lastOtpRequestTime != undefined && currentDate > (0, dateFunctions_1.AddMinutesToDate)(student.lastOtpRequestTime, otp_1.MAX_OTP_TRIALS_IN_MINUTES)) {
        student.OtpAttemptCount = '0';
        student.lastOtpRequestTime = undefined;
    }
    //if request is within 1 hour then check otpCount. if otpCount>3 return error.
    if (student.lastOtpRequestTime != undefined
        &&
            currentDate < (0, dateFunctions_1.AddMinutesToDate)(student.lastOtpRequestTime, otp_1.MAX_OTP_TRIALS_IN_MINUTES)
        &&
            parseInt(student.OtpAttemptCount) >= otp_1.MAX_OTP_TRIALS) {
        const response = { "status": "Failure", "details": "Only 3 OTP request in 1 hour" };
        return (0, ApiResponse_1.sendError)(res, 400, 'Only 3 OTP request in 1 hour. Now apply after 1 hr', response);
    }
    //Generate OTP 
    const otp = otp_generator_1.default.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const expiration_time = (0, dateFunctions_1.AddMinutesToDate)(currentDate, otp_1.OTP_EXPIRE_AFTER_MINUTES);
    //Create OTP instance in OTP model
    const otp_instance = new Otp_1.default({
        otp: otp,
        expiration_time: expiration_time,
    });
    yield otp_instance.save();
    // Create details object containing the phone number and otp id
    const details = {
        "timestamp": currentDate,
        "check": phone,
        "success": true,
        "message": "OTP sent to user",
        "otp_id": otp_instance._id
    };
    // Encrypt the details object
    const encoded = yield (0, crypt_1.encode)(JSON.stringify(details));
    // sendOTP by fast2way sms :- it is set but unabled it to save cost
    if (process.env.NODE_ENV === 'production') {
        const sendDetails = yield (0, sendOtp_1.default)(otp, phone);
        if (!sendDetails.return)
            return (0, ApiResponse_1.sendError)(res, 400, 'Failed to send OTP', { status: "fail" });
    }
    const response = {
        verification_code: encoded
    };
    // update the student model
    student.lastOtpRequestTime = currentDate;
    student.OtpAttemptCount = String(parseInt(student.OtpAttemptCount) + 1);
    yield student.save();
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'OTP sent Successful', response);
}));
const verifyOtp = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { verification_code, otp, check, type } = req.body;
    const currentDate = new Date();
    //type :- FORGOT,REGISTER
    //Check if verification code is altered or not
    let decoded;
    try {
        decoded = yield (0, crypt_1.decode)(verification_code);
    }
    catch (error) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Verification code not valid', { message: "Verification code not valid" });
    }
    const decodedObj = JSON.parse(decoded);
    // Check if the OTP was meant for the same email or phone number for which it is being verified 
    if (decodedObj.check != check) {
        const errorData = { "Status": "Failure", "Details": "OTP was not sent to this particular email or phone number" };
        return (0, ApiResponse_1.sendError)(res, 400, 'OTP was not sent to this particular email or phone number', errorData);
    }
    const otp_instance = yield Otp_1.default.findById(decodedObj.otp_id);
    // if otp is not present in db
    if (!otp_instance)
        return (0, ApiResponse_1.sendError)(res, 400, 'Otp is expired', { message: "Otp is expired" });
    // if otp is expired
    if (otp_instance.expiration_time < currentDate)
        return (0, ApiResponse_1.sendError)(res, 400, 'Otp is expired', { message: "Otp is expired" });
    //Check if OTP is equal to the OTP in the DB
    if (otp != otp_instance.otp)
        return (0, ApiResponse_1.sendError)(res, 400, 'Incorrect OTP', { message: "Incorrect OTP" });
    //so if the otp matches delete the OTP from db
    yield Otp_1.default.findByIdAndDelete(decodedObj.otp_id);
    // if register then 
    let response = {};
    if (type === 'REGISTER') {
        //  update phone_verified of that student to true
        const student = yield Student_1.default.findOneAndUpdate({ phone: check }, { phone_verified: true });
        if (!student)
            return (0, ApiResponse_1.sendError)(res, 400, 'Student not found with this phone number', { message: "Student not found with this phone number" });
        // create a token
        const token = yield student.generateAuthToken();
        response = {
            otp_verified: true,
            user_id: student._id,
            name: student.fullName(),
            token,
            phone: check
        };
    }
    else if (type === 'FORGOT') {
        response = {
            otp_verified: true,
            phone: check
        };
    }
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'OTP verified', response);
}));
const login = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //user_contact can be email/phone
    const { user_contact: userContact, password } = req.body;
    //getting the type of user_contact either email or phone or invalid
    const type = yield (0, auth_1.emailOrPhoneNumber)(userContact);
    if (type === 'invalid')
        return (0, ApiResponse_1.sendError)(res, 400, 'Invalid User Contact', {});
    //get the student from db
    let student;
    if (type === 'phone') {
        student = yield Student_1.default.findOne({ phone: userContact });
        if (!student)
            return (0, ApiResponse_1.sendError)(res, 400, 'Phone is not registered', {});
    }
    if (type === 'email') {
        student = yield Student_1.default.findOne({ email: userContact });
        if (!student)
            return (0, ApiResponse_1.sendError)(res, 400, 'Email is not registered', {});
    }
    //check the password is correct
    const isMatch = yield student.comparePassword(password);
    if (!isMatch)
        return (0, ApiResponse_1.sendError)(res, 400, 'Invalid Password', {});
    //check the phone is verified
    if (!student.phone_verified)
        return (0, ApiResponse_1.sendError)(res, 400, 'Phone is not verified', {});
    //create a token
    const token = yield student.generateAuthToken();
    const response = {
        user_id: student._id,
        name: student.fullName(),
        token,
        phone: student.phone
    };
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'Login Successful', response);
}));
const changePassword = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //user_contact can be email/phone
    const { phone, new_password: newPassword } = req.body;
    if (!phone)
        return (0, ApiResponse_1.sendError)(res, 400, 'Phone number not provided', {});
    if (!newPassword)
        return (0, ApiResponse_1.sendError)(res, 400, 'New Password not provided', {});
    //encryt the new password and 
    const salt = yield bcrypt_1.default.genSalt(10);
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
    // find the stduent by phone number and update the password with new hashedPassword
    const student = yield Student_1.default.findOneAndUpdate({ phone }, { $set: { password: hashedPassword } }, { new: true });
    if (!student)
        return (0, ApiResponse_1.sendError)(res, 400, 'Student not found', {});
    const response = {
        check: phone,
        success: true,
        message: "Password changed successfully"
    };
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'Password changed Successfully', response);
}));
exports.default = { register, getOtp, verifyOtp, login, changePassword };
//# sourceMappingURL=auth.js.map