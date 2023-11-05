import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';
import { sendError } from '../utils/ApiResponse'; 


const validateAsSchema = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: true });

    if (error) {
      const errorMessage = error.details[0].message;
      return sendError(res, 400, errorMessage, {error});
    }

    next();
  };
};

export { validateAsSchema };
