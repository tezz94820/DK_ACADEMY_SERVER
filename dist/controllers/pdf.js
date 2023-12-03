"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSolutionContent = exports.getPdfSolutionByQuestion = exports.getpdfSolution = exports.createPdfSolution = exports.getPdfPage = exports.createPdf = exports.getPdfBySubject = void 0;
const PdfSolution_1 = __importDefault(require("../models/PdfSolution"));
const PyqPDF_1 = __importDefault(require("../models/PyqPDF"));
const AWSClient_1 = require("../utils/AWSClient");
const ApiResponse_1 = require("../utils/ApiResponse");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const getPdfBySubject = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //ensuring subject is provided
    const subject = req.params.subject.toLowerCase();
    if (['mathematics', 'physics', 'chemistry'].includes(subject) === false) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Invalid subject', {});
    }
    const allPdf = yield PyqPDF_1.default.find({ subject: { $regex: new RegExp(subject, 'i') } }).sort({ displayPriorities: 1 });
    //segregate pdfs by module
    const modules = Array.from(new Set(allPdf.map(item => item.module)));
    let pdfModuleswise = modules.map(module => {
        const pdfs = allPdf.filter(item => item.module === module).sort((a, b) => Number(a.display_priority) - Number(b.display_priority));
        return {
            module: module,
            pdfs: pdfs
        };
    });
    //sort  is used to order the modules and pdfs according to displayPriority
    pdfModuleswise = pdfModuleswise.sort((a, b) => Number(a.pdfs[0].display_priority) - Number(b.pdfs[0].display_priority));
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'Successful request', pdfModuleswise);
}));
exports.getPdfBySubject = getPdfBySubject;
const createPdf = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, module, subject, new_launch = true, thumbnail, class_name, price, old_price, content_link = "not present still", free = false, language = "English", display_priority } = req.body;
    //calculate discount
    const discount = Math.round((Number(old_price) - Number(price)) / Number(old_price) * 100).toString();
    //create pdf
    const newPdfOptions = { title, module, subject, new_launch, thumbnail, class_name, price, old_price, discount, content_link, free, language, display_priority };
    const pdf = yield PyqPDF_1.default.create(newPdfOptions);
    //create Empty Pdf Solution Document
    const newPdfSolution = {
        pyq_pdf: pdf._id,
        solutions: [],
    };
    const pdfSolutionDoc = yield PdfSolution_1.default.create(newPdfSolution);
    if (!pdfSolutionDoc)
        return (0, ApiResponse_1.sendError)(res, 400, 'Failed to create pdf solution document', {});
    //update pdf document with pdf_solution id
    pdf.pdf_solution = pdfSolutionDoc._id;
    pdf.save();
    //craete folder in s3 pyq-pdf folder
    const folderCreated = yield (0, AWSClient_1.createFolder)(`pyq-pdf/${pdf._id}/`);
    if (!folderCreated) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    }
    return (0, ApiResponse_1.sendSuccess)(res, 201, 'Successfully created new pdf course', pdf);
}));
exports.createPdf = createPdf;
const getPdfPage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pdf_id } = req.query;
    if (!pdf_id) {
        return (0, ApiResponse_1.sendError)(res, 401, "please send the pdf_id", {});
    }
    //give the pdf if it's free
    const pdf = yield PyqPDF_1.default.findById(pdf_id);
    if (!pdf)
        return (0, ApiResponse_1.sendError)(res, 400, 'No PDF Found', pdf);
    if (pdf.free) {
        // create a pre signed url for the user
        const presignedUrl = yield (0, AWSClient_1.createPresignedUrlByKey)(`pyq-pdf/${pdf._id}/pdf.pdf`, 20);
        //send the presigned url to user
        return (0, ApiResponse_1.sendSuccess)(res, 200, 'successful request', { presignedUrl });
    }
    // return sendError(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'successful request', { pdf_id });
}));
exports.getPdfPage = getPdfPage;
const createPdfSolution = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { solutions, pdf_id } = req.body;
    const { command } = req.query;
    //new :- replace solutions array 
    // add :- if new questions then add. 
    // replace :- . if exists then replace the answer
    const pdfSolutionDoc = yield PdfSolution_1.default.findOne({ pyq_pdf: pdf_id });
    let newPdfSolutionDoc;
    if (command === "new") {
        newPdfSolutionDoc = yield PdfSolution_1.default.findByIdAndUpdate(pdfSolutionDoc._id, { solutions }, { new: true });
    }
    else if (command === "add") {
        const newSolutions = pdfSolutionDoc.solutions.concat(solutions);
        newPdfSolutionDoc = yield PdfSolution_1.default.findByIdAndUpdate(pdfSolutionDoc._id, { solutions: newSolutions }, { new: true });
    }
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'successful request', { newPdfSolutionDoc });
}));
exports.createPdfSolution = createPdfSolution;
const getpdfSolution = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pdf_id } = req.query;
    if (!pdf_id) {
        return (0, ApiResponse_1.sendError)(res, 400, 'pelase provide the pdf_id', {});
    }
    const pdfSolutionDoc = yield PdfSolution_1.default.findOne({ pyq_pdf: pdf_id });
    if (!pdfSolutionDoc) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Solutions to Pdf not Found', {});
    }
    const solutions = pdfSolutionDoc.solutions;
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'successful request', { solutions });
}));
exports.getpdfSolution = getpdfSolution;
const getPdfSolutionByQuestion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pdf_id: pdfId, question } = req.query;
    if (!pdfId)
        return (0, ApiResponse_1.sendError)(res, 400, 'please provide pdf_id', {});
    if (!question)
        return (0, ApiResponse_1.sendError)(res, 400, 'please provide question', {});
    //find the pdf solution doc 
    const pdfSolutionDoc = yield PdfSolution_1.default.findOne({ pyq_pdf: pdfId });
    if (!pdfSolutionDoc) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Solutions to Pdf not Found', {});
    }
    //check if the solution to that doc exists. 
    let solutionId;
    pdfSolutionDoc.solutions.forEach(item => {
        if (item.question === question && item.answer != '') {
            solutionId = item._id;
            return;
        }
    });
    if (!solutionId) {
        return (0, ApiResponse_1.sendError)(res, 400, `Solution to Question ${question} Not Found`, {});
    }
    //create presigned url for that pdf question number
    let presignedPdfUrl, presignedVideoUrl;
    try {
        presignedPdfUrl = yield (0, AWSClient_1.createPresignedUrlByKey)(`pyq-pdf/${pdfId}/solutions/${solutionId}/pdf.pdf`, 3600);
    }
    catch (error) {
        console.log(error.message);
        return (0, ApiResponse_1.sendError)(res, 400, 'No PDF File Uploaded to AWS S3', {});
    }
    //create presigned url for video by question number
    try {
        presignedVideoUrl = yield (0, AWSClient_1.createPresignedUrlByKey)(`pyq-pdf/${pdfId}/solutions/${solutionId}/video.mp4`, 3600);
    }
    catch (error) {
        console.log(error.message);
        return (0, ApiResponse_1.sendError)(res, 400, 'No Video File Uploaded to AWS S3', {});
    }
    return (0, ApiResponse_1.sendSuccess)(res, 200, 'successful request', { pdf_url: presignedPdfUrl, video_url: presignedVideoUrl });
}));
exports.getPdfSolutionByQuestion = getPdfSolutionByQuestion;
const uploadSolutionContent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pdf_id: pdfId, question } = req.query;
    if (!pdfId)
        return (0, ApiResponse_1.sendError)(res, 400, 'please provide pdf_id', {});
    if (!question)
        return (0, ApiResponse_1.sendError)(res, 400, 'please provide question', {});
    const { pdf, video } = req.files;
    //find the pdf solution doc 
    const pdfSolutionDoc = yield PdfSolution_1.default.findOne({ pyq_pdf: pdfId });
    if (!pdfSolutionDoc) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Solutions to Pdf not Found', {});
    }
    //get the solutionID. 
    let solutionId;
    pdfSolutionDoc.solutions.forEach(item => {
        if (item.question === question && item.answer != '') {
            solutionId = item._id;
            return;
        }
    });
    //craete folder in s3 pyq-pdf folder
    const folderCreated = yield (0, AWSClient_1.createFolder)(`pyq-pdf/${pdfId}/solutions/${solutionId}/`);
    if (!folderCreated) {
        return (0, ApiResponse_1.sendError)(res, 400, 'Failed to create folder in s3 of curretn pdf', {});
    }
    let videoUploaded = false;
    let pdfUploaded = false;
    //upload PDF
    if (pdf) {
        const uploadedPdf = yield (0, AWSClient_1.uploadFileToFolderInS3)(pdf[0], `pyq-pdf/${pdfId}/solutions/${solutionId}/pdf.pdf`);
        if (!uploadedPdf)
            return (0, ApiResponse_1.sendError)(res, 400, 'Failed to upload PDF to s3', {});
        pdfUploaded = true;
    }
    //upload Video
    if (video) {
        const uploadedVideo = yield (0, AWSClient_1.uploadFileToFolderInS3)(video[0], `pyq-pdf/${pdfId}/solutions/${solutionId}/video.mp4`);
        if (!uploadedVideo)
            return (0, ApiResponse_1.sendError)(res, 400, 'Failed to upload Video to s3', {});
        videoUploaded = true;
    }
    return (0, ApiResponse_1.sendSuccess)(res, 200, `successful Uploaded ${videoUploaded ? 'Video' : ''} ${videoUploaded && pdfUploaded ? 'and' : ''} ${pdfUploaded ? 'PDF' : ''} to particular  solutions folder ${solutionId}`, {});
}));
exports.uploadSolutionContent = uploadSolutionContent;
//# sourceMappingURL=pdf.js.map