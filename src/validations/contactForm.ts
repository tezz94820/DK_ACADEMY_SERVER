import Joi from "joi";

const createContactFormValidationSchema = Joi.object({
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
    .required()
    .messages({
      "any.required": "Phone number is required.",
      "string.empty": "Phone number cannot be empty.",
    }),
    class: Joi.string().messages({
      "any.required": "class is required.",
      "string.empty": "class cannot be empty.",
    }),
  message: Joi.string().allow("").optional(),
});

export {
    createContactFormValidationSchema
}