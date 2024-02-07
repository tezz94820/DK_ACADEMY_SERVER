// import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from 'express';
import TheoryCourse, { ITheoryCourse, LecturesType } from "../models/TheoryCourse";
import { createPresignedPutUrlByKey, createPresignedUrlByKey, deleteObjectByKey, getListOfKeysStartingWithPrefix, publicBaseUrl } from "../utils/AWSClient";
import { sendError, sendSuccess } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Schema} from 'mongoose';
import mongoose from "mongoose";





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

    const newLecture:LecturesType = {
        _id: new mongoose.Types.ObjectId(),
        title:"",
        lecture_number: '1'
    }
    theoryCourse.lectures.push(newLecture);
    
    await theoryCourse.save();

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





export const editTheoryCourse = catchAsync( async (req:Request, res:Response): Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Course ID', {});

    const { title, module, subject, thumbnail, class_name, price, old_price, language} = req.body;
    //contentToChange :- will include the content to be edited in the db.
    const contentToChange = { title, module, subject, class_name, price, old_price, language };
    for( let item in contentToChange){
        if(!contentToChange[item]){
            delete contentToChange[item];
        }
    }

    const theoryCourse = await TheoryCourse.findByIdAndUpdate(courseId, contentToChange,{new:true});
    //calculate discount if price or old_price is changed
    if(contentToChange.price){
        theoryCourse.discount = Math.round( (Number(theoryCourse.old_price) - Number(price)) / Number(theoryCourse.old_price) * 100).toString();
    }
    if(contentToChange.old_price){
        theoryCourse.discount = Math.round( (Number(theoryCourse.old_price) - Number(theoryCourse.price)) / Number(old_price) * 100).toString();
    }

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

    return sendSuccess(res, 200, 'successfull request', {presignedUrl});
})



export const deleteTheoryCourse = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    // delete the Test from db
    const theoryCourse = await TheoryCourse.findByIdAndDelete(courseId);
    if(!theoryCourse){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    //delete the thumbnail and from the AWS S3 bucket
    await deleteObjectByKey('public',`theory-course/${theoryCourse._id}/thumbnail.png`); 

    return sendSuccess(res, 200, 'Successful request', "delete Successfull" );
})




export const getTheoryCourseById = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.query;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails:ITheoryCourseWithIsPurchased = await TheoryCourse.findById(courseId).lean(true);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    // if user is authenticated and req.user exists then check if the user has purchased course or not.
    let purchasedProductIds = [];
    // if the course is valid as validity then add the productid in this array
    if(req.user){
        purchasedProductIds = req.user.products_purchased.filter( item => item.validity > new Date() ).map( item => item.product_id.toString());
    }
    console.log(purchasedProductIds)
    // addition of is_purchased field, if user has purchased the course then  add is_purchased true or else false
    theoryCourseDetails.is_purchased = purchasedProductIds.includes(theoryCourseDetails._id.toString());


    return sendSuccess(res, 200, 'Successful request', {theory_course_details:theoryCourseDetails} );
})


export const addLectureToTheoryCourse = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails = await TheoryCourse.findById( courseId );
    const newLecture:LecturesType = {
        _id: new mongoose.Types.ObjectId(),
        title:"",
        lecture_number: (theoryCourseDetails.lectures.length+1).toString()
    }
    theoryCourseDetails.lectures.push( newLecture );
    await theoryCourseDetails.save();
    
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    return sendSuccess(res, 200, 'Successful request', {} );
})



export const uploadTheoryCourseLectureContent = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    const { lecture_id:lectureId, title, video, notes } = req.body; 
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});
    if(!lectureId) 
        return sendError(res, 400, 'please provide Theory Course Lecture ID', {});

    const theoryCourseDetails = await TheoryCourse.findById(courseId);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    if(title){
        theoryCourseDetails.lectures.forEach( lecture => {
            if(lecture._id.toString() === lectureId){
                lecture.title = title;
            }
        })
    }
    await theoryCourseDetails.save();

    const allLectureIds = theoryCourseDetails.lectures.map( item => item._id.toString());

    if(!allLectureIds.includes(lectureId)){
        return sendError(res, 400, 'Invalid Lecture ID', {});
    }

    const presignedUrl = {
        video: "",
        notes: ""
    }

    if(video === "true"){
        // create presigned url for uploading video
        const videoKey = `theory-course/${theoryCourseDetails._id}/lectures/${lectureId}/video.mp4`;
        presignedUrl.video = await createPresignedPutUrlByKey('private', videoKey, 'video/mp4', 30 * 60);
    }

    if(notes === "true"){
        // create presigned url for uploading notes
        const notesKey = `theory-course/${theoryCourseDetails._id}/lectures/${lectureId}/notes.pdf`;
        presignedUrl.notes = await createPresignedPutUrlByKey('private', notesKey, 'application/pdf', 30 * 60);
    }

    return sendSuccess(res, 200, 'Successful request', {presignedUrl} );
})




export const getTheoryCourseLecturesContentWithCheck = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails = await TheoryCourse.findById(courseId).lean(true);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    type LecturesType = {
        _id: mongoose.Types.ObjectId;
        title: string;
        video_check:boolean;
        notes_check:boolean;
    }

    // get the keys of the videos and pdfs through AWS S3
    const baseKey = `theory-course/${courseId}/lectures/`;
    const baseKeyArray = await getListOfKeysStartingWithPrefix('private', baseKey);
    
    //preparing the lectures array and putting video_check and notes_check if it exists in the baseKey array.
    //that means if the video and notes exists then make it true
    const lectures:LecturesType[] = await Promise.all(theoryCourseDetails.lectures.map( async item => {
        const video_check:boolean = baseKeyArray.includes(`${baseKey}${item._id}/video.mp4`);
        const notes_check:boolean = baseKeyArray.includes(`${baseKey}${item._id}/notes.pdf`);
        const lecture = {...item, video_check, notes_check};
        return lecture;
    }));
    
    return sendSuccess(res, 200, 'Successful request', {lectures} );
})



export const getTheoryCourseLectures = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails = await TheoryCourse.findById(courseId);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }
    
    return sendSuccess(res, 200, 'Successful request', { lectures: theoryCourseDetails.lectures } );
})




export const deleteLectureToTheoryCourse = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails = await TheoryCourse.findById( courseId );
    
    if(theoryCourseDetails.lectures.length === 1){
        return sendError(res, 400, 'Last Lecture cannot be deleted', {});
    }
    theoryCourseDetails.lectures.pop();
    await theoryCourseDetails.save();
    
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    return sendSuccess(res, 200, 'Successful request', {} );
})




export const getTheoryCourseFreeLectures = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});

    const theoryCourseDetails = await TheoryCourse.findById(courseId).lean(true);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    const freeLectures = theoryCourseDetails.lectures.slice(0,2);
    
    return sendSuccess(res, 200, 'Successful request', { lectures: freeLectures } );
})


export const getLectureContentByLectureId = catchAsync(async (req:AuthenticatedRequest,res:Response):Promise<void> => {
    const { course_id:courseId, lecture_id:lectureId } = req.params;
    if(!courseId) 
        return sendError(res, 400, 'please provide Theory Course ID', {});
    if(!lectureId) 
        return sendError(res, 400, 'please provide Lecture ID', {});

    const theoryCourseDetails = await TheoryCourse.findById(courseId).lean(true);
    if(!theoryCourseDetails){
        return sendError(res, 400, 'Theory Course Not Found', {});
    }

    const lecture = theoryCourseDetails.lectures.find( item => item._id.toString() === lectureId);
    if(!lecture){
        return sendError(res, 400, 'Invalid Lecture ID', {});
    }

    // to check if the user has purchased the course
    if(Number(lecture.lecture_number) > 2){
        const purchasedContentIds = req.user.products_purchased.map( item => item.product_id.toString());
        if(!purchasedContentIds.includes(courseId)){
            return sendError(res, 400, 'Course Not Purchased', {});
        }
    }

    const presignedUrl = {
        video:'',
        notes:''
    }


    
    //create presigned url for video by lecture ID
    try {
        presignedUrl.video = await createPresignedUrlByKey('private',`theory-course/${courseId}/lectures/${lectureId}/video.mp4`,3600);
    } catch (error:any) {
        console.log(error.message)
        return sendError(res, 400, 'No Video File Uploaded to AWS S3', {});
    }

    //create presigned url for notes by lecture ID
    try {
        presignedUrl.notes = await createPresignedUrlByKey('private',`theory-course/${courseId}/lectures/${lectureId}/notes.pdf`,3600);
    } catch (error:any) {
        console.log(error.message)
        return sendError(res, 400, 'No Video File Uploaded to AWS S3', {});
    }

    return sendSuccess(res, 200, 'Successful request', { presigned_url: presignedUrl } );
})