// import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from 'express';
import TheoryCourse, { ITheoryCourse } from "../models/TheoryCourse";
import { createPresignedPutUrlByKey, publicBaseUrl } from "../utils/AWSClient";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../middlewares/auth";



interface ITheoryCourseWithIsPurchased extends ITheoryCourse {
    is_purchased?: boolean
}

export const createTheoryCourse = catchAsync(async (req:Request,res:Response):Promise<void> => {
    const { title, module, subject, thumbnail, class_name, price, old_price, language } = req.body;
    //calculate discount
    const discount = Math.round( (Number(old_price) - Number(price)) / Number(old_price) * 100).toString();
    const display_priority = 100;

    // create new theory course
    const newtheoryCourseOptions = {title, module, subject, class_name, price, old_price, discount, language, display_priority};
    const theoryCourse = await TheoryCourse.create(newtheoryCourseOptions);

    const presignedUrl = {
        thumbnail:''
    }
    if(thumbnail === "true"){
        // create presigned url for uploading thumbnail image
        const thumbnailKey = `theory-course/${theoryCourse._id}/thumbnail.png`;
        presignedUrl.thumbnail = await createPresignedPutUrlByKey('public', thumbnailKey, 'image/png', 10 * 60);
    
        //update the url of thumbnail in db
        theoryCourse.thumbnail = publicBaseUrl(thumbnailKey);
    }
    
    theoryCourse.save();

    return sendSuccess(res, 201, 'Successfully created new pdf course', {presignedUrl});
})



export const getTheoryCourseBySubject = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    //ensuring subject is provided
    const subject  = req.params.subject.toLowerCase();
    if(['mathematics','physics','chemistry'].includes(subject) === false){
        return sendError(res, 400, 'Invalid subject', {});
    }
    
    const allTheoryCourses:ITheoryCourseWithIsPurchased[] = await TheoryCourse.find({ subject: { $regex: new RegExp(subject, 'i') } }).sort({displayPriorities: 1}).lean(true);
    
    // if user is authenticated and req.user exists then check if the user has purchased course or not.
    let purchasedProductIds = [];
    // if the course is valid as validity then add the productid in this array
    if(req.user){
        purchasedProductIds = req.user.products_purchased.filter( item => item.validity > new Date() ).map( item => item.product_id.toString());
    }
    
    // addition of is_purchased field
    allTheoryCourses.forEach( course => {
            // if user has purchased the course then add add is_purchased true or else false
            course.is_purchased = purchasedProductIds.includes(course._id.toString());
    }) 

    //segregate pdfscourses by module
    const modules = Array.from(new Set(allTheoryCourses.map( item => item.module)));
    let courseModuleswise = modules.map( module => {
        const courses = allTheoryCourses.filter( item => item.module === module).sort( (a,b) => Number(a.display_priority) - Number(b.display_priority));
        return {
            module: module,
            courses: courses
        }   
    });

    //sort  is used to order the modules and pdfs according to displayPriority
    courseModuleswise = courseModuleswise.sort( (a,b) => Number(a.courses[0].display_priority) - Number(b.courses[0].display_priority));

    return sendSuccess(res, 200, 'Successful request', courseModuleswise);
})