import Joi from "joi";

export const createTestValidationSchema = Joi.object({
    title: Joi.string().required().messages({
      "any.required": "title is required.",
      "string.empty": "title cannot be empty.",
    }),
    type: Joi.string().required().messages({
      "any.required": "type is required.",
      "string.empty": "type cannot be empty.",
    }),
    thumbnail: Joi.string().required().messages({
      "any.required": "thumbnail is required.",
      "string.empty": "thumbnail cannot be empty.",
    }),
    start_date: Joi.string().required().messages({
        "any.required": "start date is required.",
        "string.empty": "start date cannot be empty.",
    }),
    end_date: Joi.string().required().messages({
        "any.required": "start date is required.",
        "string.empty": "start date cannot be empty.",
    }),
    start_time: Joi.string().required().messages({
      "any.required": "start time is required.",
      "string.empty": "start time cannot be empty.",
    }),
    end_time: Joi.string().required().messages({
        "any.required": "end time is required.",
        "string.empty": "end time cannot be empty.",
    }),
    duration: Joi.string().required().messages({
        "any.required": "duration is required.",
        "string.empty": "duration cannot be empty.",
    }),
    total_marks: Joi.string().required().messages({
        "any.required": "total marks is required.",
        "string.empty": "total marks cannot be empty.",
    }),
    free: Joi.boolean().messages({
        "boolean.base": 'The free field must be a boolean value',
    }),
});