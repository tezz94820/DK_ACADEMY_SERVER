import PYQPDF, { IPYQPDF } from "../models/PyqPDF";
import { createFolder } from "../utils/AWSClient";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from 'express';



const getPdfBySubject = catchAsync(async (req:Request,res:Response):Promise<void> => {
    const { subject } = req.params;
    const pdfs = await PYQPDF.find({subject});
    console.log(subject);
    sendSuccess(res, 200, 'Successful request', pdfs);
})

const createPdf = catchAsync(async (req:Request,res:Response):Promise<void> => {
    const { title, module, subject, new_launch=true, thumbnail, class_name, price, old_price, content_link="not present still", free=false, language="English" } = req.body;
    
    //calculate discount
    const discount = String((Number(old_price) - Number(price)) / Number(old_price) * 100);

    //create pdf
    const newPdfOptions = {title, module, subject, new_launch, thumbnail, class_name, price, old_price, discount, content_link, free, language};
    const pdf = await PYQPDF.create(newPdfOptions);

    //craete folder in s3 pyq-pdf folder
    const folderCreated = await createFolder(`pyq-pdf/${pdf._id}/`);
    if(!folderCreated) {
        return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    }
    sendSuccess(res, 201, 'Successfully created new pdf course', pdf);
})



export { getPdfBySubject, createPdf }