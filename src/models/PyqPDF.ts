import mongoose, { Schema, Document, Model  } from 'mongoose';

//typescript types

type TeachersType = {
    name: string,
    image: string,
    experience: string,
    subject: string
}

export interface IPYQPDF extends Document {
    title: string;
    module: string;
    subject: string;
    new_launch: boolean;
    thumbnail: string;
    class_name: string;
    price: string;
    old_price: string;
    discount: string;
    free: boolean;
    language: string;
    display_priority: string;
    pdf_solution: Document;
    exam_type: string;
    description:string[];
    teachers:TeachersType[];
    createdAt: Date;
    updatedAt: Date;
}

//schema
const PYQPDFSchema = new Schema<IPYQPDF>({
    title: {
        type: String,
        required: [true, 'Please enter the title'],
    },
    module: {
        type: String,
        required: [true, 'Please enter the module'],
    },
    subject: {
        type: String,
        enum: ['mathematics', 'physics', 'chemistry'],
        required: [true, 'please enter Subject Name'],
    },
    new_launch: {
        type: Boolean,
        default: true,
    },
    thumbnail:{
        type: String,
    },
    class_name: {
        type: String,
        required: [true, 'Please enter the class'],
    },
    price: { 
        type: String,
        required: [true, 'Please enter the price'],
    },
    old_price: {
        type: String,
        required: [true, 'Please enter the old price'],
    },
    discount: {
        type: String,
    },
    free:{
        type: Boolean,
        default: false
    },
    language:{
        type: String,
        default: "English",
    },
    display_priority:{
        type: String,
        required: [true, 'Please enter display_priority'],
    },
    pdf_solution:{
        type: Schema.Types.ObjectId,
        ref: 'PdfSolution',
    },
    exam_type: {
        type: String,
        enum: ["advance","mains"],
        default: "mains"
    },
    description: {
        type: [String]
    },
    teachers: [
        {
            name: String,
            image:String,
            experience: String,
            subject: String
        }
    ]
}, {timestamps: true})

// Compound unique index on title and exam_type
PYQPDFSchema.index({ title: 1, exam_type: 1 }, { unique: true });

// model
const PYQPDF = mongoose.model<IPYQPDF>('PyqPDF', PYQPDFSchema);

//export
export default PYQPDF;