import { AuthenticatedRequest } from "../middlewares/auth";
import PdfSolution from "../models/PdfSolution";
import PYQPDF, { IPYQPDF } from "../models/PyqPDF";
import { createFolder, createPresignedUrlByKey } from "../utils/AWSClient";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from 'express';



const getPdfBySubject = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    //ensuring subject is provided
    const subject  = req.params.subject.toLowerCase();
    if(['mathematics','physics','chemistry'].includes(subject) === false){
        return sendError(res, 400, 'Invalid subject', {});
    }
    
    const allPdf = await PYQPDF.find({ subject: { $regex: new RegExp(subject, 'i') } }).sort({displayPriorities: 1});
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
    const { title, module, subject, new_launch=true, thumbnail, class_name, price, old_price, content_link="not present still", free=false, language="English", display_priority } = req.body;
    
    //calculate discount
    const discount = Math.round((Number(old_price) - Number(price)) / Number(old_price) * 100).toString();

    //create pdf
    const newPdfOptions = {title, module, subject, new_launch, thumbnail, class_name, price, old_price, discount, content_link, free, language, display_priority};
    const pdf = await PYQPDF.create(newPdfOptions);

    //create Empty Pdf Solution Document
    const newPdfSolution = {
        pyq_pdf: pdf._id,
        solutions: [],
    }
    const pdfSolutionDoc = await PdfSolution.create(newPdfSolution);
    if(!pdfSolutionDoc)
        return sendError(res, 400, 'Failed to create pdf solution document', {});

    //update pdf document with pdf_solution id
    pdf.pdf_solution = pdfSolutionDoc._id;
    pdf.save();

    //craete folder in s3 pyq-pdf folder
    const folderCreated = await createFolder(`pyq-pdf/${pdf._id}/`);
    if(!folderCreated) {
        return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    }
    return sendSuccess(res, 201, 'Successfully created new pdf course', pdf);
})


const getPdfPage = catchAsync(async (req:Request,res:Response):Promise<void> => {
    const { pdf_id } = req.query;
    console.log(pdf_id);
    if(!pdf_id){
        return sendError(res, 401, "please send the pdf_id",{});
    }

    //give the pdf if it's free
    const pdf = await PYQPDF.findById(pdf_id);
    if(!pdf)
        return sendError(res, 400, 'No PDF Found', pdf);
    if(pdf.free){
        // create a pre signed url for the user
        const presignedUrl = await createPresignedUrlByKey(`pyq-pdf/${pdf._id}/pdf.pdf`,20);
        //send the presigned url to user
        return sendSuccess(res, 200, 'successful request', {presignedUrl});
    }
    
    // return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    return sendSuccess(res, 200, 'successful request', {pdf_id});
})


const createPdfSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { solutions, pdf_id } = req.body;
    const { command } = req.query; 
    //new :- replace solutions array 
    // add :- if new questions then add. 
    // replace :- . if exists then replace the answer

    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdf_id}); 
    let newPdfSolutionDoc;
    if(command === "new"){
        newPdfSolutionDoc = await PdfSolution.findByIdAndUpdate(pdfSolutionDoc._id, {solutions} , {new:true});
    }
    else if(command === "add"){
        const newSolutions = pdfSolutionDoc.solutions.concat(solutions);
        newPdfSolutionDoc = await PdfSolution.findByIdAndUpdate(pdfSolutionDoc._id, {solutions:newSolutions} , {new:true});
    }

    return sendSuccess(res, 200, 'successful request', {newPdfSolutionDoc});

})


const getpdfSolution = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id } = req.query;

    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdf_id});
    if(!pdfSolutionDoc) {
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }

    const solutions = pdfSolutionDoc.solutions;
    return sendSuccess(res, 200, 'successful request', {solutions});
})

const getPdfByQuestion = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { pdf_id:pdfId, question } = req.query;
    if(!pdfId) return sendError(res, 400, 'please provide pdf_id', {});
    if(!question) return sendError(res, 400, 'please provide question', {});

    //find the pdf solution doc 
    const pdfSolutionDoc = await PdfSolution.findOne({pyq_pdf: pdfId});
    if(!pdfSolutionDoc) {
        return sendError(res, 400, 'Solutions to Pdf not Found', {});
    }
    //check if the solution to that doc exists. 
    let questionExist:boolean = false;
    pdfSolutionDoc.solutions.forEach( item => {
        if(item.question === question && item.answer != '' ){
            questionExist = true; 
            return;
        }
    })

    if(!questionExist){
        return sendError(res, 400, `Solution to Question ${question} Not Found`, {});
    }

    //create presigned url for that pdf question number
    let presignedUrl;
    try {
        presignedUrl = await createPresignedUrlByKey(`pyq-pdf/${pdfId}/solutions/${question}.pdf`,20);
    } catch (error:any) {
        console.log(error.message)
        return sendError(res, 400, 'No PDF File Uploaded to AWS S3', {});
        
    }

    return sendSuccess(res, 200, 'successful request', {presignedUrl});
})

export { getPdfBySubject, createPdf, getPdfPage, createPdfSolution, getpdfSolution, getPdfByQuestion }