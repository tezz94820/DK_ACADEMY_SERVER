import { AuthenticatedRequest } from "../middlewares/auth";
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
        const presignedUrl = await createPresignedUrlByKey(`pyq-pdf/${pdf._id}/pdf.pdf`,5);
        //send the presigned url to user
        return sendSuccess(res, 200, 'successful request', {presignedUrl});
    }
    
    // return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    return sendSuccess(res, 200, 'successful request', {pdf_id});
})




export { getPdfBySubject, createPdf, getPdfPage }