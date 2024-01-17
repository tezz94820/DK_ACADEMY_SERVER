import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Request, Response } from 'express';
import Test, { ICorrectOptions, IQuestion, ITest } from "../models/Test";
import TestAttempt from "../models/TestAttempt.";
import mongoose from "mongoose";
import { createFolder, deleteObjectByKey, publicBaseUrl, uploadFileToFolderInS3 } from "../utils/AWSClient";

const setDateFormat = (date:string):string => {
    let newDate = new Date(date).toLocaleString('en-IN'); 
    let [day, month, year] = newDate.split(',')[0].split('/');
    newDate = `${Number(day)<10 ? `0${day}` : day }-${Number(month)<10 ? `0${month}` : month }-${year}`;
    return newDate;
}

const createNewTest = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    let { title, type, start_date, end_date, start_time, end_time, duration, total_marks, free } = req.body;
    const { thumbnail } = req.files as { thumbnail?: Express.Multer.File[] };
    
    // creating new test document
    const test = await Test.create({title, type, start_date, end_date, start_time, end_time, duration, total_marks, free});
    
    //craete folder in s3 tests folder
    const folderCreated = await createFolder('public',`tests/${test._id}/`);
    if(!folderCreated) {
        return sendError(res, 400, 'Failed to create folder in s3 of current test', {});
    }

    //save the thumbnail in the newly created folder
    const thumbnailKey = `tests/${test._id}/thumbnail.png`;
    const uploadedImage = await uploadFileToFolderInS3('public', thumbnail[0], thumbnailKey );
    if(!uploadedImage) {
        return sendError(res, 400, 'Failed to upload Thumbnail to s3', {});
    }

    //update the url of thumbnail in db
    test.thumbnail = publicBaseUrl(thumbnailKey);

    //creating initial test questions, options, correct_options
    const totalQuestions = test.type === 'flt' ? 90 : 30;
    for(let i=0;i<totalQuestions;i++){
        const question:IQuestion = {
            question_number: String(i+1),
            question_pattern: ((i>=0 && i<=19) || (i>=30 && i<=49) || (i>=60 && i<=79)) ? 'mcq' : 'numerical',
            question_type: 'text',
            question: '',
            question_subject: test.type === 'flt' ?  i<30 ? 'physics' : i<60 ? 'chemistry' : 'mathematics' : test.type,
            options:[
                { option_name: 'A', option_type: 'text', option: ''},
                { option_name: 'B', option_type: 'text', option: ''},
                { option_name: 'C', option_type: 'text', option: ''},
                { option_name: 'D', option_type: 'text', option: ''}
            ]
        }
            
        const correct_option:ICorrectOptions = {
            question_number: String(i+1),
            correct_option: ''
        }

        test.questions.push(question);
        test.correct_options.push(correct_option);
    }

    //saving the final Test document
    await test.save();

    return sendSuccess(res, 200, 'Successful request', "success" );
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
            ['PHYSICS']: string;
            ['PHYSICS NUMERIC']: string;
            ['CHEMISTRY']: string;
            ['CHEMISTRY NUMERIC']: string;
            ['MATHEMATICS']: string;
            ['MATHEMATICS NUMERIC']: string;
        };
    }
    

    const testDetails:ITestWithTabDetails = await Test.findById(id).select({title:1,type:1,duration:1,questions:1}).lean(true);
    if(!testDetails){
        return sendError(res, 400, 'Test not found', {});
    }
    //saving the first question in particular tab in flt test
    testDetails.tabDetails = {
        ['PHYSICS']: '10000',
        ['PHYSICS NUMERIC']: '10000',
        ['CHEMISTRY']: '10000',
        ['CHEMISTRY NUMERIC']: '10000',
        ['MATHEMATICS']: '10000',
        ['MATHEMATICS NUMERIC']: '10000'
    }
    if(testDetails.type === 'flt'){
        testDetails.questions.forEach( question => {
            if(question.question_pattern === 'mcq'){
                if(question.question_subject === 'physics'){
                    testDetails.tabDetails['PHYSICS'] = Math.min(Number(testDetails.tabDetails['PHYSICS']),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'chemistry'){
                    testDetails.tabDetails['CHEMISTRY'] = Math.min(Number(testDetails.tabDetails['CHEMISTRY']),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'mathematics'){
                    testDetails.tabDetails['MATHEMATICS'] = Math.min(Number(testDetails.tabDetails['MATHEMATICS']),Number(question.question_number)).toString();
                }
            }
            else if(question.question_pattern === 'numerical'){
                if(question.question_subject === 'physics'){
                    testDetails.tabDetails['PHYSICS NUMERIC'] = Math.min(Number(testDetails.tabDetails['PHYSICS NUMERIC']),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'chemistry'){
                    testDetails.tabDetails['CHEMISTRY NUMERIC'] = Math.min(Number(testDetails.tabDetails['CHEMISTRY NUMERIC']),Number(question.question_number)).toString();
                }
                else if(question.question_subject === 'mathematics'){
                    testDetails.tabDetails['MATHEMATICS NUMERIC'] = Math.min(Number(testDetails.tabDetails['MATHEMATICS NUMERIC']),Number(question.question_number)).toString();
                }
            } 
        })    
    }

    testDetails.total_questions = String(testDetails.questions.length);
    delete testDetails.questions;
    return sendSuccess(res, 200, 'Successful request', testDetails );
})

const createTestQuestions = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testId = req.params?.id;
    if(!testId){
        return sendError(res, 400, 'Please provide test id', {});
    }

    const { question_number, question_pattern, question_subject, question, option_A:option_A_text, option_B:option_B_text, option_C:option_C_text, option_D:option_D_text, correct_option } = req.body;
    const { 
        question:question_img,
        option_A:option_A_img,
        option_B:option_B_img, 
        option_C:option_C_img, 
        option_D:option_D_img,
        solution_pdf,
        solution_video
    } = req.files as { question?: Express.Multer.File[], option_A?: Express.Multer.File[], option_B?: Express.Multer.File[], option_C?: Express.Multer.File[], option_D?: Express.Multer.File[], solution_pdf?: Express.Multer.File[], solution_video?: Express.Multer.File[] };
    
    const test = await Test.findById(testId);
    
    //saving question and options 
    for(const questionItem of test.questions){
        if(questionItem.question_number === question_number){
            questionItem.question_pattern = (question_pattern === '' || question_pattern === undefined) ? questionItem.question_pattern : question_pattern;
            // question is text
            if(question !== '' && question !== undefined){
                questionItem.question = question;
                questionItem.question_type = 'text';
            }
            //question is image
            if(question_img){
                const questionKey = `tests/${test._id}/questions/${question_number}/question.png`;
                const uploadedImage = await uploadFileToFolderInS3('public', question_img[0], questionKey );
                if(!uploadedImage) {
                    return sendError(res, 400, 'Failed to upload question Image', {});
                }
                questionItem.question = publicBaseUrl(questionKey);
                questionItem.question_type = 'img';
            }
            //for options
            for(const optionItem of questionItem.options){
                // option-A
                if(optionItem.option_name === 'A'){
                    //options-A is text
                    if(option_A_text !== '' && option_A_text !== undefined){
                        optionItem.option_type = 'text' ;
                        optionItem.option = option_A_text;
                    }
                    //option-A is image
                    if(option_A_img){
                        const option_A_Key = `tests/${test._id}/questions/${question_number}/option-A.png`;
                        const uploadedImage = await uploadFileToFolderInS3('public', option_A_img[0], option_A_Key );
                        if(!uploadedImage) {
                            return sendError(res, 400, 'Failed to upload option-A Image', {});
                        }
                        optionItem.option_type = 'img';
                        optionItem.option = publicBaseUrl(option_A_Key);
                    }
                }

                // option-B
                if(optionItem.option_name === 'B'){
                    //option-B is text
                    if(option_B_text !== '' && option_B_text !== undefined){
                        optionItem.option_type = 'text' ;
                        optionItem.option = option_B_text;
                    }
                    //option-B is image
                    if(option_B_img){
                        const option_B_Key = `tests/${test._id}/questions/${question_number}/option-B.png`;
                        const uploadedImage = await uploadFileToFolderInS3('public', option_B_img[0], option_B_Key );
                        if(!uploadedImage) {
                            return sendError(res, 400, 'Failed to upload option-B Image', {});
                        }
                        optionItem.option_type = 'img';
                        optionItem.option = publicBaseUrl(option_B_Key);
                    }
                }

                // option-C
                if(optionItem.option_name === 'C'){
                    //options-C is text
                    if(option_C_text !== '' && option_C_text !== undefined){
                        optionItem.option_type = 'text' ;
                        optionItem.option = option_C_text;
                    }
                    //option-C is image
                    if(option_C_img){
                        const option_C_Key = `tests/${test._id}/questions/${question_number}/option-C.png`;
                        const uploadedImage = await uploadFileToFolderInS3('public', option_C_img[0], option_C_Key );
                        if(!uploadedImage) {
                            return sendError(res, 400, 'Failed to upload option-C Image', {});
                        }
                        optionItem.option_type = 'img';
                        optionItem.option = publicBaseUrl(option_C_Key);
                    }
                }

                // option-D
                if(optionItem.option_name === 'D'){
                    //option-D is text
                    if(option_D_text !== '' && option_D_text !== undefined){
                        optionItem.option_type = 'text' ;
                        optionItem.option = option_D_text;
                    }
                    //option-D is image
                    if(option_D_img){
                        const option_D_Key = `tests/${test._id}/questions/${question_number}/option-D.png`;
                        const uploadedImage = await uploadFileToFolderInS3('public', option_D_img[0], option_D_Key );
                        if(!uploadedImage) {
                            return sendError(res, 400, 'Failed to upload option-D Image', {});
                        }
                        optionItem.option_type = 'img';
                        optionItem.option = publicBaseUrl(option_D_Key);
                    }
                }
            }
            break; // to get out of the loop so that it does not go to next question
        }
    }

    //finding the correct option by question number and saving the correct_option , solution_pdf , solution_video
    for(const correctOption of test.correct_options){
        if(correctOption.question_number === question_number){
            //saving the new correct_option if it is provided
            if(correct_option !== '-'){
                correctOption.correct_option = correct_option;
            }
            // saving the solution pdf if it is provided
            if(solution_pdf){
                const uploadedPdf = await uploadFileToFolderInS3('private', solution_pdf[0], `tests/${testId}/solution_pdf.pdf` );
                if(!uploadedPdf) {
                    return sendError(res, 400, 'Failed to upload solution Pdf to S3', {});
                }
            }
            // saving the solution pdf if it is provided
            if(solution_video){
                const uploadedVideo = await uploadFileToFolderInS3('private', solution_video[0], `tests/${testId}/solution_video.mp4` );
                if(!uploadedVideo) {
                    return sendError(res, 400, 'Failed to upload solution Pdf to S3', {});
                }
            }
        }
    }

    //saving the changes in db
    await test.save();

    return sendSuccess(res, 200, 'Successful request', 'hello' );
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

    //search for the test
    const testDetails = await Test.findById(testId).select({questions:1});
    if(!testDetails){
        return sendError(res, 400, 'Test Not Found', {});
    }
    
    // finding the question with the given question number
    let question; 
    for( const item of testDetails.questions){
        if(item.question_number === questionNumber){
            question = item;
            break;
        }
    }

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
            question_subject: question.question_subject,
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


const getQuestionStates = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testAttemptId = req.params?.test_attempt_id;
    if(!testAttemptId){
        return sendError(res, 400, 'Please provide test attempt  id', {});
    }

    const testAttemptDetails = await TestAttempt.findById(testAttemptId).lean(true);
    if(!testAttemptDetails){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }

    const questionInteractionAnalysis = {
        ['not-visited']:0,
        ['answered']:0,
        ['not-answered']:0,
        ['marked']:0,
        ['marked-answered']:0
    }
    const questionStates = testAttemptDetails.questions.map( question => {
        questionInteractionAnalysis[question.user_interaction]++;
        return {
            question_number: question.question_number,
            user_interaction: question.user_interaction
        }
    })
    //converting it to string
    Object.keys(questionInteractionAnalysis).forEach((key) => {
        questionInteractionAnalysis[key] = questionInteractionAnalysis[key].toString();
    });
    
    

    return sendSuccess(res, 200, 'Successful request', {question_states:questionStates,question_interaction_analysis:questionInteractionAnalysis} );
})


const editTestDetails = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testId = req.params?.id;
    if(!testId){
        return sendError(res, 400, 'Please provide test id', {});
    }

    const { title, type, start_date, end_date, start_time, end_time, duration, total_marks } = req.body;
    //will include the content to be edited in the db.
    const contentToChange = { title, type, start_date, end_date, start_time, end_time, duration, total_marks };
    for( let item in contentToChange){
        if(!contentToChange[item]){
            delete contentToChange[item];
        }
    }

    //updating in the db
    const test = await Test.findByIdAndUpdate(testId, contentToChange);
    if(!test){
        return sendError(res, 400, 'Test Not Found', {});
    }

    //updating the thumbnail image in aws s3
    const { thumbnail } = req.files as { thumbnail?: Express.Multer.File[] };
    if(thumbnail){
        const uploadedImage = await uploadFileToFolderInS3('public', thumbnail[0], `tests/${testId}/thumbnail.png` );
        if(!uploadedImage) {
            return sendError(res, 400, 'Failed to upload Thumbnail to s3', {});
        }
    }

    return sendSuccess(res, 200, 'Successful request', "Update Successfull" );
})



const deleteTest = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testId = req.params?.id;
    if(!testId){
        return sendError(res, 400, 'Please provide test id', {});
    }

    // delete the Test from db
    const test = await Test.findByIdAndDelete(testId);
    if(!test){
        return sendError(res, 400, 'Test Not Found', {});
    }

    //delete the thumbnail and questions from the AWS S3 bucket
    await deleteObjectByKey('public',`tests/${test._id}/thumbnail.png`); 

    return sendSuccess(res, 200, 'Successful request', "delete Successfull" );
})


const getTestSummary = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testAttemptId = req.params?.test_attempt_id;
    if(!testAttemptId){
        return sendError(res, 400, 'Please provide test attempt  id', {});
    }

    const testAttemptDetails = await TestAttempt.findById(testAttemptId).lean(true);
    if(!testAttemptDetails){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }
    
    // initializing the empty object
    const test_summary = {};
    const subjects = ['total','physics', 'physics_numerical', 'chemistry', 'chemistry_numerical', 'mathematics', 'mathematics_numerical'];
    subjects.forEach( subject => {
        test_summary[subject] = {
            total_questions:0,
            answered:0,
            not_answered:0,
            marked_review:0,
            not_visited:0
        }
    })

    // calculating the test summary for subjects except for total
    testAttemptDetails.questions.forEach( question => {
        const subjectName = question.question_pattern === 'mcq' ? question.question_subject : (question.question_subject + '_numerical');
        test_summary[subjectName].total_questions = test_summary[subjectName].total_questions + 1;
        if(question.user_interaction === 'answered' || question.user_interaction === 'marked-answered'){
            test_summary[subjectName].answered = test_summary[subjectName].answered + 1;
        }
        if(question.user_interaction === 'not-answered'){
            test_summary[subjectName].not_answered = test_summary[subjectName].not_answered + 1;
        }
        if(question.user_interaction === 'marked'){
            test_summary[subjectName].marked_review = test_summary[subjectName].marked_review + 1;
        }
        if(question.user_interaction === 'not-visited'){
            test_summary[subjectName].not_visited = test_summary[subjectName].not_visited + 1;
        }
    })

    //adding all subjects to get total 
    for(const subject in test_summary){
        test_summary['total'].total_questions = test_summary['total'].total_questions + test_summary[subject].total_questions; 
        test_summary['total'].answered = test_summary['total'].answered + test_summary[subject].answered;
        test_summary['total'].not_answered = test_summary['total'].not_answered + test_summary[subject].not_answered;
        test_summary['total'].marked_review = test_summary['total'].marked_review + test_summary[subject].marked_review;
        test_summary['total'].not_visited = test_summary['total'].not_visited + test_summary[subject].not_visited;
    }


    return sendSuccess(res, 200, 'Successful request', {test_summary} );
})




const getTestResult = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testAttemptId = req.params?.test_attempt_id;
    if(!testAttemptId){
        return sendError(res, 400, 'Please provide test attempt  id', {});
    }

    const testAttemptDetails = await TestAttempt.findById(testAttemptId).lean(true);
    if(!testAttemptDetails){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }
    
    const correct_options = await Test.findById(testAttemptDetails.test_id).select('correct_options').lean(true);
    if(!correct_options){
        return sendError(res, 400, 'Correct Options Not Found', {});
    }

    // initializing the empty object
    const test_result = {};
    const subjects = ['total','physics', 'physics_numerical', 'chemistry', 'chemistry_numerical', 'mathematics', 'mathematics_numerical'];
    subjects.forEach( subject => {
        test_result[subject] = {
            correct_questions: 0,
            incorrect_questions: 0,
            left_questions: 0,
            total_questions: 0,
            score_total: 0,
            score_acheived: 0
        }
    })

    // calculating the test summary(total,correct,incorrect) for subjects except for total
    testAttemptDetails.questions.forEach( question => {
        // making the subject name in right format 
        const subjectName = question.question_pattern === 'mcq' ? question.question_subject : (question.question_subject + '_numerical');
        // counting total_questions for every subject
        test_result[subjectName].total_questions += 1;
        // if the question is answered or marked-answered 
        if(question.user_interaction === 'answered' || question.user_interaction === 'marked-answered'){
            const correctOption = correct_options.correct_options.find( item => item.question_number === question.question_number).correct_option;
            if(question.question_pattern === 'mcq'){
                const isCorrect = question.option && correctOption && question.option === correctOption 
                if(isCorrect){
                    test_result[subjectName].correct_questions += 1;
                }
                else{
                    test_result[subjectName].incorrect_questions += 1;
                }
            }
            else if(question.question_pattern === 'numerical'){
                const [low, high] = correctOption.split('-');
                const isValidRange = low && high && (Number(question.option) >= Number(low)) && (Number(question.option) <= Number(high));
                if(isValidRange){
                    test_result[subjectName].correct_questions += 1;
                }
                else{
                    test_result[subjectName].incorrect_questions += 1;
                }
            }
        }
    })

    // calculating testsummary(score_achevied,score_total,left_questions) for every subject
    for(const subject in test_result){
        test_result[subject].left_questions = test_result[subject].total_questions - (test_result[subject].correct_questions + test_result[subject].incorrect_questions);
        // for numerical
        if(['physics_numerical', 'chemistry_numerical', 'mathematics_numerical'].includes(subject) ){
            test_result[subject].score_total = Math.min(5*4,test_result[subject].total_questions*4);
            test_result[subject].score_acheived = Math.min(5*4,test_result[subject].correct_questions*4 - test_result[subject].incorrect_questions );
        }// for mcq
        else{
            test_result[subject].score_total = test_result[subject].total_questions*4;
            test_result[subject].score_acheived = test_result[subject].correct_questions*4 - test_result[subject].incorrect_questions;
        }
    }
    
    // calculating the total as subject
    for(const subject in test_result){
        test_result['total'].correct_questions += test_result[subject].correct_questions;
        test_result['total'].incorrect_questions += test_result[subject].incorrect_questions;
        test_result['total'].left_questions += test_result[subject].left_questions;
        test_result['total'].total_questions += test_result[subject].total_questions;
        test_result['total'].score_total += test_result[subject].score_total;
        test_result['total'].score_acheived += test_result[subject].score_acheived;
    }

    return sendSuccess(res, 200, 'Successful request', {test_result} );
})




const getTestAnswersAnalysis = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const testAttemptId = req.params?.test_attempt_id;
    if(!testAttemptId){
        return sendError(res, 400, 'Please provide test attempt  id', {});
    }

    const testAttemptDetails = await TestAttempt.findById(testAttemptId).lean(true);
    if(!testAttemptDetails){
        return sendError(res, 400, 'Test Attempt Not Found', {});
    }
    
    const testDetails = await Test.findById(testAttemptDetails.test_id).select('questions correct_options').lean(true);
    if(!testDetails){
        return sendError(res, 400, 'Correct Options Not Found', {});
    }
    const plainTestDetails:any = { ... testDetails };

    // initializing the empty object test_questions
    const test_questions = {};
    const subjects = ['physics', 'physics_numerical', 'chemistry', 'chemistry_numerical', 'mathematics', 'mathematics_numerical'];
    subjects.forEach( subject => {
        test_questions[subject] = [];
    })

    
    for(const question of plainTestDetails.questions){
        // Adding correct option to every question
        const correctOption = plainTestDetails.correct_options.find( item => item.question_number === question.question_number );
        question.correct_option = correctOption.correct_option;
        // adding user selected option in every question
        const userSelectedOption = testAttemptDetails.questions.find( item => item.question_number === question.question_number);
        question.user_interaction = userSelectedOption.user_interaction;
        question.user_selected_option = userSelectedOption.option;
        // setting the user answer is correct or not
        if(question.question_pattern === 'mcq'){
            const isCorrect:boolean = question.user_selected_option && question.correct_option && question.user_selected_option === question.correct_option
            if(isCorrect){
                question.user_answer_is_correct = true;
            }
            else{
                question.user_answer_is_correct = false;
            }
        }
        else{
            const [low, high] = question.correct_option.split('-');
            const isValidRange:boolean = (low && high && (Number(question.user_selected_option) >= Number(low)) && (Number(question.user_selected_option) <= Number(high)));
            if(isValidRange){
                question.user_answer_is_correct = true;
            }
            else{
                question.user_answer_is_correct = false;
            }
        }
        // segregating the questions as per subject
        const subjectName = question.question_pattern === 'mcq' ? question.question_subject : (question.question_subject + '_numerical');
        test_questions[subjectName].push(question);
    }

    return sendSuccess(res, 200, 'Successful request', {test_questions} );
})




export { createNewTest, getTestListTypeWise, getTestDetailsById, getTestStartDetailsById, createTestQuestions, getTestQuestion, getTestAttemptRegistry,
    OptionWithUserInteraction, getSelectedOptionByQuestionNumber, getQuestionStates, editTestDetails, deleteTest, getTestSummary, getTestResult, getTestAnswersAnalysis  }