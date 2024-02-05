import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { razorpayInstance } from "../utils/Razorpay";
import PYQPDF from "../models/PyqPDF";
import { AuthenticatedRequest } from "../middlewares/auth";
import Student from "../models/Student";
import Transaction from "../models/Transaction";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { VALIDITY_IN_MONTHS } from "../constants/pyqCourse";

type ProductOptions = {
    key:string;
    amount: string;
    currency: string;
    name: string;
    description?: string;
    image: string;
    order_id: string;
    callback_url: string;
    prefill?: { 
        name: string, 
        email: string,
        contact: string 
    };
    notes:{
        transaction_id: string;
    }
    theme?: {
        color?: string;
        backdrop_color?: string;
    }
}


export const createPaymentOrder = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { type, product_id:productId } = req.body;
    if(!type)
        return sendError(res, 400, 'please provide type', {});
    if(!productId)
        return sendError(res, 400, 'please provide product_id', {});

    
    let checkoutOptions:ProductOptions;
    
    if(type === 'pyq'){
        // find the PyqPdf course
        const pyqPdf = await PYQPDF.findById(productId);
        if(!pyqPdf){
            return sendError(res, 400, 'Pyq PDF not found', {});
        }
        
        //create a transaction for this product
        const transaction = new Transaction();
        transaction.student_id = req.user._id;
        transaction.product_type = 'pyq';
        transaction.product_id = pyqPdf._id;
        transaction.amount = (parseInt(pyqPdf.price)*100).toString();
        transaction.status = 'started';

        const options = {
            amount: parseInt(pyqPdf.price)*100,  // amount in the smallest currency unit paisa
            currency: "INR",
            receipt: transaction._id.toString()
        }

        try {
            const productOrder = await razorpayInstance.orders.create(options);
            checkoutOptions = {
                key: process.env.RAZORPAY_KEY_ID,
                amount: pyqPdf.price,
                currency: "INR",
                name: "DK Academy",
                description: pyqPdf.title,
                image: "https://www.dkacademy.co.in/logo.png",
                order_id: productOrder.id,
                callback_url: ``,
                prefill: {
                    name: req.user.payment_details.name ? req.user.payment_details.name : '',
                    email: req.user.payment_details.email ? req.user.payment_details.email : '',
                    contact: req.user.payment_details.contact ? req.user.payment_details.contact : ''
                },
                notes:{
                    transaction_id: transaction._id.toString()
                },
                theme: {
                    color: "#1e40af",
                }
            }
            transaction.order_id = productOrder.id;
            await transaction.save();

        } catch (error:any) {
            return sendError(res, 400, error.message, {});
        }
    }
      
    sendSuccess(res, 200, 'Student created successfully', {options:checkoutOptions});
})




export const verifyPaymentOrder = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    //validating the authenticity of the webhook and checking the signature returned by razorpay by matching with the our webhook secret.
    const webhookValidated = validateWebhookSignature(JSON.stringify(req.body), req.headers['x-razorpay-signature'] as string, process.env.RAZORPAY_WEBHOOK_SECRET);
    if(!webhookValidated){
        return sendError(res, 400, 'Invalid signature', {});
    }

    // get the transaction_id and find the document in transaction collection
    const transaction_id = req.body.payload.payment.entity.notes.transaction_id;
    const transaction = await Transaction.findById(transaction_id);

    //save the webhook payload in trnasaction document
    transaction.razorpay_payload = req.body.payload;
    transaction.status = 'success';

    //save the transaction
    await transaction.save();

    // add the course to the student purchased courses.
    const validity = new Date()
    validity.setFullYear(new Date().getFullYear() + VALIDITY_IN_MONTHS/12) ;
    await Student.findByIdAndUpdate(transaction.student_id, {
        $push: {
            products_purchased:{
                product_id: transaction.product_id,
                product_type: transaction.product_type,
                validity: validity
            }
        }
    })

    sendSuccess(res, 200, 'success', {});

})