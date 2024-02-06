import Joi from "joi";

const createTheoryValidationSchema = Joi.object({
  title: Joi.string().required().messages({
    "any.required": "Title is required.",
    "string.empty": "Title cannot be empty.",
  }),
  module: Joi.string().required().messages({
    "any.required": "module is required.",
    "string.empty": "module cannot be empty.",
  }),
  subject: Joi.string().required().messages({
    "any.required": "subject is required.",
    "string.empty": "subject cannot be empty.",
  }),
  thumbnail: Joi.string().required().messages({
    "any.required": "Thumbnail url is required.",
    "string.empty": "Thumbnail url cannot be empty.",
  }),
  class_name: Joi.string().required().messages({
    "any.required": "class is required.",
    "string.empty": "class cannot be empty.",
  }),
  price: Joi.string().pattern(new RegExp("^[1-9]\\d*$")).required().messages({
      "any.required": "price is required.",
      "string.pattern.base": "Price should contains only numerical values",
  }),
  old_price: Joi.string().pattern(new RegExp("^[1-9]\\d*$")).required().messages({
    "any.required": "old_price is required.",
    "string.pattern.base": "old_Price should contains only numerical values",
  }),
  language: Joi.string().messages({
    "string.base": 'The free field must be a boolean value',
  }),
});


export { createTheoryValidationSchema }