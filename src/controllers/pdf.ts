import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/auth";
import PdfSolution from "../models/PdfSolution";
import PYQPDF, { IPYQPDF } from "../models/PyqPDF";
import { createFolder, createPresignedPutUrlByKey, createPresignedUrlByKey, deleteObjectByKey, getListOfKeysStartingWithPrefix, publicBaseUrl, uploadFileToFolderInS3 } from "../utils/AWSClient";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from 'express';
import {SolutionObjectType} from "../models/PdfSolution";


interface IPyqPdfWithIsPurchased extends IPYQPDF {
    is_purchased?: boolean
}


const getPdfBySubject = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    //ensuring subject is provided
    const subject  = req.params.subject.toLowerCase();
    if(['mathematics','physics','chemistry'].includes(subject) === false){
        return sendError(res, 400, 'Invalid subject', {});
    }
    let {exam_type : examType}:{exam_type?: string} = req.query;
    examType = examType.toLowerCase();
    
    const allPdf:IPyqPdfWithIsPurchased[] = await PYQPDF.find({ subject: { $regex: new RegExp(subject, 'i') }, exam_type: { $regex: new RegExp(examType, 'i') } }).sort({displayPriorities: 1}).lean(true);
    
    // if user is authenticated and req.user exists then check if the user has purchased course or not.
    let purchasedProductIds = [];
    // if the course is valid as validity then add the productid in this array
    if(req.user){
        purchasedProductIds = req.user.products_purchased.filter( item => item.validity > new Date() ).map( item => item.product_id.toString());
    }
    
    // addition of is_purchased field
    allPdf.forEach( pdf => {
            // if user has purchased the course then add add is_purchased true or else false
            pdf.is_purchased = purchasedProductIds.includes(pdf._id.toString());
    }) 

    //segregate pdfs by module
    const modules = Array.from(new Set(allPdf.map( item => item.module)));
    let pdfModuleswise = modules.map( module => {
        const pdfs = allPdf.filter( item => item.module === module).sort( (a,b) => Number(a.display_priority) - Number(b.display_priority));
        return {
            module: module,
            pdfs: pdfs
        }   
    });

    //sort  is used to order the modules and pdfs according to displayPriority
    pdfModuleswise = pdfModuleswise.sort( (a,b) => Number(a.pdfs[0].display_priority) - Number(b.pdfs[0].display_priority));

    return sendSuccess(res, 200, 'Successful request', pdfModuleswise);
})

const createPdf = catchAsync(async (req:Request,res:Response):Promise<void> => {
    const { title, module, subject, thumbnail, class_name, price, old_price, free, language, exam_type } = req.body;
    //calculate discount
    const discount = Math.round( (Number(old_price) - Number(price)) / Number(old_price) * 100).toString();
    const display_priority = 100;

    // //create pdf
    const newPdfOptions = {title, module, subject, class_name, price, old_price, discount, free, language, display_priority, exam_type};
    const pdf = await PYQPDF.create(newPdfOptions);

    //create Empty Pdf Solution Document with a single question initailly
    const newPdfSolution = {
        pyq_pdf: pdf._id,
        solutions: [{_id:new mongoose.Types.ObjectId(),question:'1',answer:'-'}],
    }
    const pdfSolutionDoc = await PdfSolution.create(newPdfSolution);
    if(!pdfSolutionDoc)
        return sendError(res, 400, 'Failed to create pdf solution document', {});


    //update pdf document with pdf_solution id
    pdf.pdf_solution = pdfSolutionDoc._id;
    const presignedUrl = {
        thumbnail:''
    }
    if(thumbnail === "true"){
        // create presigned url for uploading thumbnail image
        const thumbnailKey = `pyq-pdf/${pdf.exam_type}/${pdf._id}/thumbnail.png`;
        presignedUrl.thumbnail = await createPresignedPutUrlByKey('public', thumbnailKey, 'image/png', 10 * 60);
    
        //update the url of thumbnail in db
        pdf.thumbnail = publicBaseUrl(thumbnailKey);
    }
    
    pdf.save();

    return sendSuccess(res, 201, 'Successfully created new pdf course', {presignedUrl});
})


const getPdfPage = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id } = req.params;
    if(!pdf_id){
        return sendError(res, 401, "please send the pdf_id",{});
    }

    //give the pdf if it's free
    const pdf = await PYQPDF.findById(pdf_id).lean(true);
    if(!pdf)
        return sendError(res, 400, 'No PDF Found', pdf);

    // check if the user has purchased the product, if the course is valid as validity then add the productid in this array
    const purchasedProductIds = req.user.products_purchased.filter( item => item.validity > new Date() ).map( item => item.product_id.toString());
    if(!purchasedProductIds.includes(pdf._id.toString())){
        return sendError(res, 400, 'Please purchase the course', {});
    }
    // create a pre signed url for the user
    const presignedUrl = await createPresignedUrlByKey('private',`pyq-pdf/${pdf.exam_type}/${pdf._id}/pdf.pdf`,20);
    if(!presignedUrl){
        return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    }
    //send the presigned url to user
    return sendSuccess(res, 200, 'successful request', {presignedUrl});
})


const createPdfSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    const { question_number:questionNumber, video, pdf, answer} = req.body;

    if(!pdfId){
        return sendError(res, 400, 'pelase provide the pdf_id', {});
    }    
    
    if(!questionNumber){
        return sendError(res, 400, 'please provide question number', {});
    } 

    const pdfDetails = await PYQPDF.findById(pdfId);
    if(!pdfDetails){
        return sendError(res, 400, 'No PDF Found', {});
    }

    const pdfSolutions = await PdfSolution.findOne({pyq_pdf:pdfId});
    if(!pdfSolutions){
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    const presignedUrl = { video:'', pdf:''};
    // if answer is provided 
    if(answer){
        // save the answer in the PdfSolution
        for(const solution of pdfSolutions.solutions){
            if(solution.question === questionNumber){
                solution.answer = answer;
                break;
            }
        }
        await pdfSolutions.save(); 
    }

    //get the solution - ID
    const solutionId = pdfSolutions.solutions.find( item => item.question === questionNumber)._id.toString();

    if(pdf === "true"){
        // create presigned url for uploading pdf
        const pdfKey = `pyq-pdf/${pdfDetails.exam_type}/${pdfId}/solutions/${solutionId}/pdf.pdf`;
        presignedUrl.pdf = await createPresignedPutUrlByKey('private', pdfKey, 'application/pdf', 10 * 60);
    }

    if(video === "true"){
        // create presigned url for uploading video
        const videoKey = `pyq-pdf/${pdfDetails.exam_type}/${pdfId}/solutions/${solutionId}/video.mp4`;
        presignedUrl.video = await createPresignedPutUrlByKey('private', videoKey, 'video/mp4', 10 * 60);
    }

    return sendSuccess(res, 200, 'successful request', { presignedUrl } );

})


const getpdfSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id } = req.query;
    if(!pdf_id){
        return sendError(res, 400, 'pelase provide the pdf_id', {});
    }

    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdf_id});
    if(!pdfSolutionDoc) {
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    const solutions = pdfSolutionDoc.solutions;
    return sendSuccess(res, 200, 'successful request', {solutions});
})

const getPdfSolutionByQuestion = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id:pdfId, question } = req.query;
    if(!pdfId) return sendError(res, 400, 'please provide pdf_id', {});
    if(!question) return sendError(res, 400, 'please provide question', {});

    //find the pyqPdf model course to get the exam_type
    const {exam_type : examType} = await PYQPDF.findById(pdfId).select('exam_type');
    
    //find the pdf solution doc 
    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdfId});
    if(!pdfSolutionDoc) {
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    //get the solution - ID
    const solutionId = pdfSolutionDoc.solutions.find( item => item.question === question)._id.toString();


    //create presigned url for that pdf question number
    let presignedPdfUrl:string, presignedVideoUrl:string;
    try {
        presignedPdfUrl = await createPresignedUrlByKey('private',`pyq-pdf/${examType}/${pdfId}/solutions/${solutionId}/pdf.pdf`,3600);
    } catch (error:any) {
        console.log(error.message)
        return sendError(res, 400, 'No PDF File Uploaded to AWS S3', {});
    }

    //create presigned url for video by question number
    try {
        presignedVideoUrl = await createPresignedUrlByKey('private',`pyq-pdf/${examType}/${pdfId}/solutions/${solutionId}/video.mp4`,3600);
    } catch (error:any) {
        console.log(error.message)
        return sendError(res, 400, 'No Video File Uploaded to AWS S3', {});
    }

    return sendSuccess(res, 200, 'successful request', {pdf_url:presignedPdfUrl,video_url:presignedVideoUrl});
})



const editPyqPdf = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    const { title, module, subject, thumbnail, class_name, price, old_price, free, language, exam_type } = req.body;
    //contentToChange :- will include the content to be edited in the db.
    const contentToChange = { title, module, subject, class_name, price, old_price, language, exam_type, free };
    for( let item in contentToChange){
        if(!contentToChange[item]){
            delete contentToChange[item];
        }
    }
    // we need to convert the datatype of free from string to boolean for "true" -> true and "false" -> false
    if(free === "true"){
        contentToChange.free = true;
    }
    else if(free === "false"){
        contentToChange.free = false;
    }

    const pdf = await PYQPDF.findByIdAndUpdate(pdfId, contentToChange);
    //calculate discount if price or old_price is changed
    if(contentToChange.price){
        pdf.discount = Math.round( (Number(pdf.old_price) - Number(price)) / Number(pdf.old_price) * 100).toString();
    }
    if(contentToChange.old_price){
        pdf.discount = Math.round( (Number(pdf.old_price) - Number(pdf.price)) / Number(old_price) * 100).toString();
    }

    const presignedUrl = {
        thumbnail:''
    }
    if(thumbnail === "true"){
        // create presigned url for uploading thumbnail image
        const thumbnailKey = `pyq-pdf/${pdf.exam_type}/${pdf._id}/thumbnail.png`;
        presignedUrl.thumbnail = await createPresignedPutUrlByKey('public', thumbnailKey, 'image/png', 10 * 60);
    
        //update the url of thumbnail in db
        pdf.thumbnail = publicBaseUrl(thumbnailKey);
    }
    
    pdf.save();

    return sendSuccess(res, 200, 'successfull request', {presignedUrl});
})

const deletePyqPdf = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    // delete the Test from db
    const pdf = await PYQPDF.findByIdAndDelete(pdfId);
    if(!pdf){
        return sendError(res, 400, 'PYQ PDF Not Found', {});
    }

    //delete the test solutions from PdfSolutions
    await PdfSolution.deleteOne({pyq_pdf:pdfId});

    //delete the thumbnail and from the AWS S3 bucket
    await deleteObjectByKey('public',`pyq-pdf/${pdf.exam_type}/${pdf._id}/thumbnail.png`); 

    return sendSuccess(res, 200, 'Successful request', "delete Successfull" );
})



const uploadPyqPdf = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    const pdf = await PYQPDF.findById(pdfId);
    if(!pdf){
        return sendError(res, 400, 'PYQ PDF Not Found', {});
    }

    // create presigned put url for course pdf
    const presignedUrl = { coursePdf: ''};
    const pdfKey = `pyq-pdf/${pdf.exam_type}/${pdf._id}/pdf.pdf`;
    presignedUrl.coursePdf = await createPresignedPutUrlByKey('private', pdfKey, 'application/pdf', 10 * 60);

    return sendSuccess(res, 200, 'Successful request', {presignedUrl} );
})




const getSolutionsWithCheck = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    const pdf = await PYQPDF.findById(pdfId);
    if(!pdf){
        return sendError(res, 400, 'PYQ PDF  Not Found', {});
    }

    const pdfSolutions = await PdfSolution.findOne({pyq_pdf: pdfId}).lean(true);
    if(!pdfSolutions){
        return sendError(res, 400, 'Pdf Solutions Not Found', {});
    }

    type SolutionsType = {
        question:string;
        answer:string;
        video_check:boolean;
        pdf_check:boolean;
    }

    // get the keys of the videos and pdfs through AWS S3
    const baseKey = `pyq-pdf/${pdf.exam_type}/${pdfId}/solutions/`
    const baseKeyArray = await getListOfKeysStartingWithPrefix('private', baseKey);
    
    //preparing the solution array and putting video_check and pdf_check if it exists in the baseKey array.
    //that means if the video and pdf exists then make it true
    const solutions:SolutionsType[] = await Promise.all(pdfSolutions.solutions.map( async item => {
        const video_check:boolean = baseKeyArray.includes(`${baseKey}${item._id}/video.mp4`);
        const pdf_check:boolean = baseKeyArray.includes(`${baseKey}${item._id}/pdf.pdf`);
        const solution = {...item, video_check, pdf_check};
        return solution;
    }));
    
    return sendSuccess(res, 200, 'Successful request', {solutions} );
})





const deletePdfSolution = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    const questionNumber = req.query.question_number;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});
    if(!questionNumber){
        return sendError(res, 400, 'please provide question number', {});
    }

    const pdf = await PYQPDF.findById(pdfId);
    if(!pdf){
        return sendError(res, 400, 'PYQ PDF  Not Found', {});
    }

    const pdfSolutions = await PdfSolution.findOne({pyq_pdf: pdfId});
    if(!pdfSolutions){
        return sendError(res, 400, 'Pdf Solutions Not Found', {});
    }
    if(pdfSolutions.solutions.length === 0){
        return sendError(res, 400, 'No Solutions Found To Delete ', {});
    }

    //if its not first or last element do not delete question
    if(!['1', String(pdfSolutions.solutions.length)].includes(questionNumber as string)){
        return sendError(res, 400, 'Only First and last Question can be Deleted', {});
    }   


    let solutionId = '';
    //delete solution entry from db
    if(questionNumber === '1'){
        solutionId = pdfSolutions.solutions[0]._id.toString();
        pdfSolutions.solutions = pdfSolutions.solutions.slice(1).map( item => ({...item, question:String(Number(item.question)-1)}));
    }
    else if(questionNumber === String(pdfSolutions.solutions.length)){
        solutionId = pdfSolutions.solutions[pdfSolutions.solutions.length-1]._id.toString();
        pdfSolutions.solutions = pdfSolutions.solutions.slice(0,-1);
    }
    // save the changes in the PdfSolution
    await pdfSolutions.save(); 
    //delete pdf solution
    await deleteObjectByKey('private',`pyq-pdf/${pdf.exam_type}/${pdf._id}/solutions/${solutionId}/pdf.pdf`); 
    //delete video solution
    await deleteObjectByKey('private',`pyq-pdf/${pdf.exam_type}/${pdf._id}/solutions/${solutionId}/video.mp4`);
    
    return sendSuccess(res, 200, 'Successful request', "solution deleted successfully" );
})



const addPdfSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    const questionNumber = req.query.question_number;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});
    if(!questionNumber){
        return sendError(res, 400, 'please provide question number', {});
    } 

    const pdfDetails = await PYQPDF.findById(pdfId);
    if(!pdfDetails){
        return sendError(res, 400, 'No PDF Found', {});
    }

    const pdfSolutions = await PdfSolution.findOne({pyq_pdf:pdfId});
    if(!pdfSolutions){
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    //if its not first or last element do not add question
    if(!['1', String(pdfSolutions.solutions.length+1)].includes(questionNumber as string)){
        return sendError(res, 400, 'Only First and last Question can be Added', {});
    }   

    // if the new question "1" is added
    if(questionNumber === '1'){
        const initialObject = [{ _id:new mongoose.Types.ObjectId(), question:'1', answer:"-" }];
        const restObject = pdfSolutions.solutions.map( item => ({ ...item, question:String(Number(item.question)+1)}) );
        pdfSolutions.solutions = [ ...initialObject , ...restObject ] as SolutionObjectType[];
    }
    else if(questionNumber === String(pdfSolutions.solutions.length+1)){
        const lastObject = [{ _id:new mongoose.Types.ObjectId(), question:String(pdfSolutions.solutions.length+1), answer:"-" }];
        pdfSolutions.solutions = [ ...pdfSolutions.solutions, ...lastObject ] as SolutionObjectType[];
    }
    // save the changes in the PdfSolution
    await pdfSolutions.save(); 

    return sendSuccess(res, 200, 'successful request', "successfully added question" );

})




const getPyqCourseById = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.query;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    const pyqCourseDetails = await PYQPDF.findById(pdfId).lean(true);
    if(!pyqCourseDetails){
        return sendError(res, 400, 'PYQ PDF Not Found', {});
    }

    return sendSuccess(res, 200, 'Successful request', {pyq_course_details:pyqCourseDetails} );
})




const getFreePdfPage = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { pdf_id:pdfId } = req.params;
    if(!pdfId) 
        return sendError(res, 400, 'please provide pdf Id', {});

    const pyqCourseDetails = await PYQPDF.findById(pdfId).lean(true);
    if(!pyqCourseDetails){
        return sendError(res, 400, 'PYQ PDF Not Found', {});
    }

    const presignedUrl = {
        free_pdf: ''
    }

    //creating presigned url for free_pdf.pdf
    presignedUrl.free_pdf = await createPresignedUrlByKey('private',`pyq-pdf/${pyqCourseDetails.exam_type}/${pdfId}/free_pdf.pdf`,3600);
    if(!presignedUrl.free_pdf){
        return sendError(res, 400, 'No Free Course File Found', {});
    }

    return sendSuccess(res, 200, 'Successful request', {presignedUrl} );
})



const getpdfFreeSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id } = req.query;
    if(!pdf_id){
        return sendError(res, 400, 'pelase provide the pdf_id', {});
    }

    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdf_id});
    if(!pdfSolutionDoc) {
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    const solutions = pdfSolutionDoc.solutions.slice(0,5);
    return sendSuccess(res, 200, 'successful request', {solutions});
})



export { getPdfBySubject, createPdf, getPdfPage, createPdfSolution, getpdfSolution, getPdfSolutionByQuestion, editPyqPdf, deletePyqPdf, uploadPyqPdf, getSolutionsWithCheck, addPdfSolution, deletePdfSolution, getPyqCourseById, getFreePdfPage, getpdfFreeSolution }