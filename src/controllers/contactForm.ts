import ContactForm from "../models/ContactForm";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from "express";
import moment from "moment";


const createContactForm = catchAsync(async (req:Request,res:Response):Promise<void> => {
    
    let {first_name,last_name,email,phone,message} = req.body;
    
    //create new Student
    const newStudent = await ContactForm.create({
        first_name,
        last_name,
        email,
        phone,
        message
    });

    return sendSuccess(res, 200, 'Contact Form created', newStudent);

});


const getContactForms = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { filterDate } = req.query; // Expected values: "today", "yesterday", "YYYY-MM-DD"
    
    let startDate, endDate;
    const today = moment().startOf('day');
    
    if (filterDate === "today") {
        startDate = today;
        endDate = moment().endOf('day');
    } else if (filterDate === "yesterday") {
        startDate = moment().subtract(1, 'days').startOf('day');
        endDate = moment().subtract(1, 'days').endOf('day');
    } else if (filterDate && moment(filterDate.toString(), "YYYY-MM-DD", true).isValid()) {
        startDate = moment(filterDate.toString()).startOf('day');
        endDate = moment(filterDate.toString()).endOf('day');
    }
    
    const query: any = {};
    if (startDate && endDate) {
        query.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }
    
    const contactForms = await ContactForm.find(query);
    const formattedForms = contactForms.map(form => ({
        ...form.toObject(),
        date: moment(form.createdAt).format("DD/MM/YYYY HH:mm A")
    }));
    
    return sendSuccess(res, 200, 'Contact Forms fetched', formattedForms);
});



const updateCalledStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { called } = req.body; // New called status

    // Find and update the document
    const updatedContactForm = await ContactForm.findByIdAndUpdate(
        id,
        { called },
        { new: true } // Return updated document
    );

    if (!updatedContactForm) {
        return sendError(res, 404, "Contact form not found", {});
    }

    return sendSuccess(res, 200, "Called status updated", updatedContactForm);
});


export default {createContactForm, getContactForms, updateCalledStatus};