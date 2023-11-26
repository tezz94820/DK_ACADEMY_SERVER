import { ref } from 'joi';
import mongoose, { Schema, Document, Model  } from 'mongoose';

//typescript types
export type SolutionObjectType = {
    question: string;
    answer: string;
} 

export interface IPdfSolution extends Document {
    pyq_pdf: Document;
    solutions: SolutionObjectType[];
}

//schema
const PdfSolutionSchema = new Schema<IPdfSolution>({
    pyq_pdf: {
        type: Schema.Types.ObjectId,
        ref: "PyqPdf",
        required: [true, 'Please enter the PyqPdf ref'],
    },
    solutions: [
        {
            question: {
                type: String,
                unique: true,
                required: [true, 'Please enter the question number'],
            },
            answer: {
                type: String,
                required: [true, 'Please enter the answer Option'],
            },
        }
    ],  
}, {timestamps: true})

// model
const PdfSolution = mongoose.model<IPdfSolution>('PdfSolution', PdfSolutionSchema);

//export
export default PdfSolution;