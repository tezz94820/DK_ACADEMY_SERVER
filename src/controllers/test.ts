import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Request, Response } from 'express';
import PYQPDF, { IPYQPDF } from "../models/PyqPDF";
import Test from "../models/Test";

const setDateFormat = (date:string):string => {
    let newDate = new Date(date).toLocaleString('en-IN'); 
    newDate = newDate.replace(/\//g, '-').split(',')[0];
    return newDate;
  }


const createNewTest = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    let { title, type, thumbnail, start_date, end_date, start_time, end_time, duration, total_marks, free } = req.body;
    
    //initially fix this date until set from frontend
    start_date = new Date();
    end_date = new Date();

    //creating new test document
    const test = await Test.create({title, type, thumbnail, start_date, end_date, start_time, end_time, duration, total_marks, free});
    
    return sendSuccess(res, 200, 'Successful request', test );
})

const getTestListTypeWise = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testType = req.query?.type;
    let testList = [];

    if(!testType || testType === 'free') {
        //if type is not passed or free is passed then returning all free
        testList = await Test.find({free:true}).select({title:1, type:1,start_date:1, end_date:1,duration:1,total_marks:1,free:1, thumbnail:1, start_time:1,end_time:1}).lean(true);
    }
    else {
        // returning according to type 
        const fixedType = ['physics', 'chemistry', 'mathematics', 'flt'];
        if(!fixedType.includes(testType as string)){
            return sendError(res, 400, 'Invalid test type', {});
        }
        testList = await Test.find({type:testType}).select({title:1, type:1,start_date:1, end_date:1,duration:1,total_marks:1,free:1, thumbnail:1, start_time:1,end_time:1}).lean(true);
    }
    
    //changing the test date format
    testList.forEach( test => {
        test.start_date = setDateFormat(test.start_date);
        test.end_date = setDateFormat(test.end_date);
    })

    return sendSuccess(res, 200, 'Successful request', testList );
})

const getTestDetailsById = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const id = req.params?.id;
    if(!id){
        return sendError(res, 400, 'Please provide test id', {});
    }

    const testDetails = await Test.findById(id).select({title:1, type:1,start_date:1, end_date:1,duration:1,total_marks:1,free:1, thumbnail:1, start_time:1,end_time:1}).lean(true);
    
    return sendSuccess(res, 200, 'Successful request', testDetails );
})

export { createNewTest, getTestListTypeWise, getTestDetailsById}