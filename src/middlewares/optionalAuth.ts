import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/ApiResponse'; 
import jwt, { JwtPayload } from 'jsonwebtoken'; 
import Student, { IStudent } from '../models/Student';
import catchAsync from '../utils/catchAsync';

export interface AuthenticatedRequest extends Request {
    user: IStudent; // Replace UserType with the type of the user object
  }

  // this middleware checks if token  is present and everything is valid then it makes a user property in request
  // and moves to controller or else it doesnt send the error and moves to controller. 
const optionalProtect = catchAsync( async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Getting token and check of it's there
        let token:string;
        if(!req?.headers?.authorization) return next();
        if ( !req?.headers?.authorization?.startsWith('Bearer') ) return next(); 
        // get the token from headers    
        token = req?.headers?.authorization?.split(' ')[1];
        //if token is not found then move to controller    
        if (!token) return next();

        // Verifiying token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        // if error then move to controller
        if(!decoded) return next();
        
        const user = await Student.findById(decoded.userId);
        // if user is not founf then move to controller
        if(!user) return next();

        req.user = user;
        return next();
    } catch (error) {
        return next();
    }
});


export { optionalProtect };
