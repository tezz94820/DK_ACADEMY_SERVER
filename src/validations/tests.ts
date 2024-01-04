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
    thumbnail: Joi.any(),
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

export const OptionWithUserInteractionSchema = Joi.object({
  test_attempt_id: Joi.string().required().messages({
    "any.required": "test attempt id is required.",
    "string.empty": "test attempt id cannot be empty.",
  }),
  question_number: Joi.string().required().messages({
    "any.required": "question number is required.",
    "string.empty": "question number cannot be empty.",
  }),
  option: Joi.string().allow(''),
  user_interaction: Joi.string().required().messages({
    "any.required": "user interaction is required.",
    "string.empty": "user interaction cannot be empty.",
  })
}) 