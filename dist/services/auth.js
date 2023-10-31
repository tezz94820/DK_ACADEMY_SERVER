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
exports.emailOrPhoneNumber = exports.createStudent = exports.deleteStudent = exports.checkStudentIsVerified = exports.checkStudentAlreadyPresent = void 0;
const Student_1 = __importDefault(require("../models/Student"));
const checkStudentAlreadyPresent = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield Student_1.default.findOne({ phone: phone });
    if (student)
        return true;
    return false;
});
exports.checkStudentAlreadyPresent = checkStudentAlreadyPresent;
const checkStudentIsVerified = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield Student_1.default.findOne({ phone: phone });
    if (student.phone_verified)
        return true;
    return false;
});
exports.checkStudentIsVerified = checkStudentIsVerified;
const deleteStudent = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    yield Student_1.default.findOneAndDelete({ phone: phone });
});
exports.deleteStudent = deleteStudent;
const createStudent = (first_name, last_name, email, phone, password) => __awaiter(void 0, void 0, void 0, function* () {
    const newStudent = new Student_1.default({
        first_name,
        last_name,
        email,
        phone,
        password,
        phone_verified: false,
        email_verified: false
    });
    yield newStudent.save();
    return newStudent;
});
exports.createStudent = createStudent;
const emailOrPhoneNumber = (userContact) => {
    return new Promise((resolve, reject) => {
        const phoneRegex = /^\d{10}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (phoneRegex.test(userContact))
            return resolve('phone');
        else if (emailRegex.test(userContact))
            return resolve('email');
        else
            return resolve('invalid');
    });
};
exports.emailOrPhoneNumber = emailOrPhoneNumber;
//# sourceMappingURL=auth.js.map