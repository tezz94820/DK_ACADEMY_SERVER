import mongoose, { Schema, Document } from 'mongoose';

// Option type
export interface IOption{
    option_name: string;
    option_type: string;
    option: string;
}

// Question type
export interface IQuestion{
    question_type: string;
    question: string;
    question_pattern: string;
    question_number: string;
    question_subject: string;
    options: IOption[];
}

export interface ICorrectOptions{
    question_number: String,
    correct_option: String
}
// Test schema
export interface ITest extends Document {
    title: string;
    type: string;
    thumbnail: string;
    start_date: Date | string;
    end_date: Date | string;
    start_time: string;
    end_time: string;
    duration: string;
    total_marks: string;
    free: boolean;
    questions: IQuestion[];
    correct_options: ICorrectOptions[];
}

const TestSchema = new Schema<ITest>({
    title: {
        type: String,
        required: [true, 'please provide a unique title'],
        unique: true,
    },
    type: {
        type: String,
        enum: ['physics', 'chemistry', 'mathematics', 'flt'],
        required: [true, 'please provide type of test'],
    },
    thumbnail: String,
    start_date: {
        type: Date,
        required: [true, 'please provide start date'],
    },
    end_date: {
        type: Date,
        required: [true, 'please provide end date'],
    },
    start_time: {
        type: String,
        required: [true, 'please provide start date'],
    },
    end_time: {
        type: String,
        required: [true, 'please provide end date'],
    },
    duration: {
        type: String,
        required: [true, 'please provide duration'],
    },
    total_marks: {
        type: String,
        required: [true, 'please provide total marks'],
    },
    free: {
        type: Boolean,
        default: true,
        required: [true, 'please provide free status'],
    },
    questions: [
        {
            question_type: {
                type: String,
                enum: ['text', 'img'],
            },
            question: {
                type: String,
            },
            question_pattern: {
                type: String,
                enum: ['numerical', 'mcq'],
            },
            question_number: {
                type: String,
                required: [true, 'please provide question number'],
            },
            question_subject:{
                type: String,
                enum: ['physics', 'chemistry', 'mathematics'],
            },
            options: [
                {
                    option_name: String,
                    option_type: {
                        type: String,
                        enum: ['img','text']
                    },
                    option: String,
                }
            ],
        }
    ],
    correct_options:[
        {
            question_number: String,
            correct_option: String
        }
    ]
}, { timestamps: true });

// Test model
const Test = mongoose.model<ITest>('Test', TestSchema);

// Export
export default Test;
