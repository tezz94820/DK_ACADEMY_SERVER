import Joi from "joi";

const registerValidationSchema = Joi.object({
  first_name: Joi.string().required().messages({
    "any.required": "First name is required.",
    "string.empty": "First name cannot be empty.",
  }),
  last_name: Joi.string().required().messages({
    "any.required": "Last name is required.",
    "string.empty": "Last name cannot be empty.",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.empty": "Email cannot be empty.",
    "string.email": "Invalid email format.",
  }),
  phone: Joi.string()
    .length(10)
    .pattern(/[6-9]{1}[0-9]{9}/)
    .required()
    .messages({
      "any.required": "Phone number is required.",
      "string.empty": "Phone number cannot be empty.",
      "string.length": "Phone number must be exactly 10 digits long.",
      "string.pattern.base": "Phone number is invalid.",
    }),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9@]{3,30}$")).required().messages({
      "any.required": "password is required.",
      "string.pattern.base":
      'Password must contain only letters, numbers, or "@" and be between 3 and 30 characters long.',
  }),
  confirm_password: Joi.string().valid(Joi.ref("password")).required().messages({
      "any.only": "Passwords do not match.",
      "any.required": "Confirm password is required.",
      "string.empty": "Confirm password cannot be empty.",
  }),
});



const getOtpValidationSchema = Joi.object({
  phone: Joi.string()
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


const verifyOtpValidationSchema = Joi.object({
  verification_code: Joi.string().required().messages({
    "any.required": "Verification code is required.",
    "string.empty": "Verification code cannot be empty.",
  }),
  otp: Joi.string().pattern(/^[0-9]{4}$/).required().messages({
    "any.required": "OTP is required.",
    "string.empty": "OTP cannot be empty.",
    "string.pattern.base": "OTP must be a 4-digit number.",
  }),
  check: Joi.string()
    .length(10)
    .pattern(/[6-9]{1}[0-9]{9}/)
    .required()
    .messages({
      "any.required": "Phone number is required.",
      "string.empty": "Phone number cannot be empty.",
      "string.length": "Phone number must be exactly 10 digits long.",
      "string.pattern.base": "Phone number is invalid.",
    }),
  type: Joi.string().valid('FORGOT', 'REGISTER').required().messages({
    "any.required": "Type is required.",
    "any.only": "Invalid type. Must be 'FORGOT' or 'REGISTER'.",
  }),
});

const loginValidationSchema = Joi.object({
  user_contact: Joi.alternatives().try(
    Joi.string()
      .length(10)
      .pattern(/[6-9]{1}[0-9]{9}/)
      .required()
      .messages({
        "any.required": "Phone number is required.",
        "string.empty": "Phone number cannot be empty.",
        "string.length": "Phone number must be exactly 10 digits long.",
        "string.pattern.base": "Phone number is invalid.",
      }),
    Joi.string().email().required().messages({
      "any.required": "Email is required.",
      "string.empty": "Email cannot be empty.",
      "string.email": "Invalid email format.",
    }),
    Joi.any().messages({ 
      "any.invalid": "Invalid user contact. Must be a valid phone number or email." })

  ),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9@]{3,30}$")).required().messages({
    "any.required": "Password is required.",
    "string.pattern.base": 'Password must contain only letters, numbers, or "@" and be between 3 and 30 characters long.',
  }),
});



  export { registerValidationSchema, getOtpValidationSchema, verifyOtpValidationSchema, loginValidationSchema };