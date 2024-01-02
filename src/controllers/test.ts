import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Request, Response } from 'express';
import Test, { ITest } from "../models/Test";
import TestAttempt from "../models/TestAttempt.";
import mongoose from "mongoose";

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

const getTestStartDetailsById = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const id = req.params?.id;
    if(!id){
        return sendError(res, 400, 'Please provide test id', {});
    }

    interface ITestWithTabDetails extends ITest {
        total_questions: string;
        tabDetails: {
            physics: string;
            physics_numeric: string;
            chemistry: string;
            chemistry_numeric: string;
            mathematics: string;
            mathematics_numeric: string;
        };
    }
    

    const testDetails:ITestWithTabDetails = await Test.findById(id).select({title:1,type:1,duration:1,questions:1}).lean(true);
    
    //saving the first question in particular tab in flt test
    testDetails.tabDetails = {
        physics: '10000',
        physics_numeric: '10000',
        chemistry: '10000',
        chemistry_numeric: '10000',
        mathematics: '10000',
        mathematics_numeric: '10000',
    }
    if(testDetails.type === 'flt'){
        testDetails.questions.forEach( question => {
            if(question.question_pattern === 'mcq'){
                if(question.question_subject === 'physics'){
                    testDetails.tabDetails.physics = Math.min(Number(testDetails.tabDetails.physics),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'chemistry'){
                    testDetails.tabDetails.chemistry = Math.min(Number(testDetails.tabDetails.chemistry),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'mathematics'){
                    testDetails.tabDetails.mathematics = Math.min(Number(testDetails.tabDetails.mathematics),Number(question.question_number)).toString();
                }
            }
            else if(question.question_pattern === 'numerical'){
                if(question.question_subject === 'physics'){
                    testDetails.tabDetails.physics_numeric = Math.min(Number(testDetails.tabDetails.physics_numeric),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'chemistry'){
                    testDetails.tabDetails.chemistry_numeric = Math.min(Number(testDetails.tabDetails.chemistry_numeric),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'mathematics'){
                    testDetails.tabDetails.mathematics_numeric = Math.min(Number(testDetails.tabDetails.mathematics_numeric),Number(question.question_number)).toString();
                }
            } 
        })    
    }

    testDetails.total_questions = String(testDetails.questions.length);
    delete testDetails.questions;
    return sendSuccess(res, 200, 'Successful request', testDetails );
})

const createTestQuestions = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const id = req.params?.id;
    if(!id){
        return sendError(res, 400, 'Please provide test id', {});
    }

    const testDetails = await Test.findById(id).select({questions:1});
    testDetails.questions = req.body;
    testDetails.save();

    
    return sendSuccess(res, 200, 'Successful request', testDetails );
})


const getTestQuestion = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testId = req.params?.test_id;
    const questionNumber = req.params?.question_number;
    if(!testId){
        return sendError(res, 400, 'Please provide test id', {});
    }
    if(!questionNumber){
        return sendError(res, 400, 'Please provide question number', {});
    }

    const testDetails = await Test.findById(testId).select({questions:1});
    const question = testDetails.questions.filter( item => item.question_number === questionNumber);

    return sendSuccess(res, 200, 'Successful request', question );
})



const getTestAttemptRegistry = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testId = req.params?.test_id;
    if(!testId){
        return sendError(res, 400, 'Please provide test id', {});
    }
    
    const testDetails = await Test.findById(testId).select({questions:1});
    if(!testDetails){
        return sendError(res, 400, 'Test Not Found', {});
    }

    const questions = testDetails.questions.map( question => {
        return {
            question_number: question.question_number,
            question_pattern: question.question_pattern,
            option:'',
            user_interaction:'not-visited'
        }
    })
    //create new test attempt
    const newTestAttempt = await TestAttempt.create({
        student_id:new mongoose.Types.ObjectId(req.user._id),
        test_id:new mongoose.Types.ObjectId(testId),
        questions:questions
    });
    
    return sendSuccess(res, 200, 'Successful request', {test_attempt_id:newTestAttempt._id} );
})



const OptionWithUserInteraction = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const {test_attempt_id:testAttemptId,question_number:questionNumber,option,user_interaction:userInteraction} = req.body;    
    // check if user interaction is appropriate
    if(!['answered','not-answered','marked','marked-answered','not-visited'].includes(userInteraction)){
        return sendError(res, 400, 'please provide appropriate user_interaction', {} );
    }

    //search for the test attempt
    const testAttempt = await TestAttempt.findById(testAttemptId);
    if(!testAttempt){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }

    //get the question and mark it as answered
    testAttempt.questions.forEach( question => {
        if(question.question_number === questionNumber){
            question.option = option;
            question.user_interaction = userInteraction;
            return;
        }
    })
    testAttempt.save();

    return sendSuccess(res, 200, 'Successful request', "suzzess" );
})


const getSelectedOptionByQuestionNumber = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testAttemptId = req.params?.test_attempt_id;
    if(!testAttemptId){
        return sendError(res, 400, 'Please provide test attempt  id', {});
    }
    const question_number = req.params?.question_number;
    if(!question_number){
        return sendError(res, 400, 'Please provide question number', {});
    }
    
    // search for the selected option.
    const testAttempt = await TestAttempt.findById(testAttemptId).select({questions:1});
    if(!testAttempt){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }
    let selectedOption = "";
    const question = testAttempt.questions.find( question => question.question_number === question_number);
    if( ["answered","marked-answered"].includes(question.user_interaction) ){
        selectedOption = question.option;
    }
    return sendSuccess(res, 200, 'Successful request', {selected_option:selectedOption} );
})


export { createNewTest, getTestListTypeWise, getTestDetailsById, getTestStartDetailsById, createTestQuestions, getTestQuestion, getTestAttemptRegistry,
    OptionWithUserInteraction, getSelectedOptionByQuestionNumber }