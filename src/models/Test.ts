import mongoose, { Schema, Document } from 'mongoose';

// Option schema
interface IOption extends Document {
    option_id: string;
    option_name: string;
    option_type: string;
    option: string;
}

const OptionSchema = new Schema<IOption>({
    option_id: mongoose.Types.ObjectId,
    option_name: String,
    option_type: {
        type: String,
        enum: ['img','text']
    },
    option: String,
});

// Question schema
interface IQuestion extends Document {
    question_id: string;
    question_type: string;
    question: string;
    question_pattern: string;
    question_number: string;
    question_subject: string;
    options: IOption[];
}

const QuestionSchema = new Schema<IQuestion>({
    question_id: mongoose.Types.ObjectId,
    question_type: {
        type: String,
        enum: ['text', 'img'],
    },
    question: {
        type: String,
        required: [true, 'please provide question text/url'],
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
        required: [true, 'please provide subject of question number'],
    },
    options: [OptionSchema],
});

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
    questions: [QuestionSchema],
}, { timestamps: true });

// Test model
const Test = mongoose.model<ITest>('Test', TestSchema);

// Export
export default Test;
