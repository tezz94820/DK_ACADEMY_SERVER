import mongoose, { Schema, Document, Model  } from 'mongoose';

//typescript types
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
    content_link: string;
    free: boolean;
    language: string;
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
        enum: ['Mathematics', 'Physics', 'Chemistry'],
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
    content_link: {
        type: String,
    },
    free:{
        type: Boolean,
        default: false
    },
    language:{
        type: String,
        default: "English",
    }
}, {timestamps: true})

// model
const PYQPDF = mongoose.model<IPYQPDF>('PyqPDF', PYQPDFSchema);

//export
export default PYQPDF;