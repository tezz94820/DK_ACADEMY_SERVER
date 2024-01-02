import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionAttempt {
    question_number: string;
    question_pattern: string;
    option: string;
    user_interaction: string;
}

// Question schema
const QuestionSchema = new Schema<IQuestionAttempt>({
    question_number: {
        type: String,
        required: [true, 'please provide question number']
    },
    question_pattern: {
        type: String,
        enum: ['numerical', 'mcq'],
        default: 'mcq',
    },
    option: {
        type: String,
        default: '',
    },
    user_interaction: {
        type: String,
        enum: ['answered','not-answered','marked','marked-answered','not-visited']
    }
})
// Test Attempt  schema
export interface ITestAttempt extends Document {
    student_id: Schema.Types.ObjectId;
    test_id: Schema.Types.ObjectId;
    questions: IQuestionAttempt[];
}

const TestAttemptSchema = new Schema<ITestAttempt>({
    student_id: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    test_id: {
        type: Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    questions: [QuestionSchema],
}, { timestamps: true });

// Test model
const TestAttempt = mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);

// Export
export default TestAttempt;
