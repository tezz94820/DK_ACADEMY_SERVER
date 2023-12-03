"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidationSchema = exports.verifyOtpValidationSchema = exports.getOtpValidationSchema = exports.registerValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const registerValidationSchema = joi_1.default.object({
    first_name: joi_1.default.string().required().messages({
        "any.required": "First name is required.",
        "string.empty": "First name cannot be empty.",
    }),
    last_name: joi_1.default.string().required().messages({
        "any.required": "Last name is required.",
        "string.empty": "Last name cannot be empty.",
    }),
    email: joi_1.default.string().email().required().messages({
        "any.required": "Email is required.",
        "string.empty": "Email cannot be empty.",
        "string.email": "Invalid email format.",
    }),
    phone: joi_1.default.string()
        .length(10)
        .pattern(/[6-9]{1}[0-9]{9}/)
        .required()
        .messages({
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
        "string.length": "Phone number must be exactly 10 digits long.",
        "string.pattern.base": "Phone number is invalid.",
    }),
    password: joi_1.default.string().pattern(new RegExp("^[a-zA-Z0-9@]{3,30}$")).required().messages({
        "any.required": "password is required.",
        "string.pattern.base": 'Password must contain only letters, numbers, or "@" and be between 3 and 30 characters long.',
    }),
    confirm_password: joi_1.default.string().valid(joi_1.default.ref("password")).required().messages({
        "any.only": "Passwords do not match.",
        "any.required": "Confirm password is required.",
        "string.empty": "Confirm password cannot be empty.",
    }),
});
exports.registerValidationSchema = registerValidationSchema;
const getOtpValidationSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .length(10)
        .pattern(/[6-9]{1}[0-9]{9}/)
        .required()
        .messages({
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
        "string.length": "Phone number must be exactly 10 digits long.",
        "string.pattern.base": "Phone number is invalid.",
    }),
});
exports.getOtpValidationSchema = getOtpValidationSchema;
const verifyOtpValidationSchema = joi_1.default.object({
    verification_code: joi_1.default.string().required().messages({
        "any.required": "Verification code is required.",
        "string.empty": "Verification code cannot be empty.",
    }),
    otp: joi_1.default.string().pattern(/^[0-9]{4}$/).required().messages({
        "any.required": "OTP is required.",
        "string.empty": "OTP cannot be empty.",
        "string.pattern.base": "OTP must be a 4-digit number.",
    }),
    check: joi_1.default.string()
        .length(10)
        .pattern(/[6-9]{1}[0-9]{9}/)
        .required()
        .messages({
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
        "string.length": "Phone number must be exactly 10 digits long.",
        "string.pattern.base": "Phone number is invalid.",
    }),
    type: joi_1.default.string().valid('FORGOT', 'REGISTER').required().messages({
        "any.required": "Type is required.",
        "any.only": "Invalid type. Must be 'FORGOT' or 'REGISTER'.",
    }),
});
exports.verifyOtpValidationSchema = verifyOtpValidationSchema;
const loginValidationSchema = joi_1.default.object({
    user_contact: joi_1.default.alternatives().try(joi_1.default.string()
        .length(10)
        .pattern(/[6-9]{1}[0-9]{9}/)
        .required()
        .messages({
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
        "string.length": "Phone number must be exactly 10 digits long.",
        "string.pattern.base": "Phone number is invalid.",
    }), joi_1.default.string().email().required().messages({
        "any.required": "Email is required.",
        "string.empty": "Email cannot be empty.",
        "string.email": "Invalid email format.",
    }), joi_1.default.any().messages({
        "any.invalid": "Invalid user contact. Must be a valid phone number or email."
    })),
    password: joi_1.default.string().pattern(new RegExp("^[a-zA-Z0-9@]{3,30}$")).required().messages({
        "any.required": "Password is required.",
        "string.pattern.base": 'Password must contain only letters, numbers, or "@" and be between 3 and 30 characters long.',
    }),
});
exports.loginValidationSchema = loginValidationSchema;
//# sourceMappingURL=auth.js.map