import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";

export const getProfileInfo = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    if(!req.user){
        return sendError(res, 400, 'User Not Found', {});
    }
    const student_data = {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email
    }
    return sendSuccess(res, 200, 'Successful request', {student_data});
})