import mongoose, { Schema, Document, Model  } from 'mongoose';

//typescript types

type TeachersType = {
    name: string,
    image: string,
    experience: string,
    subject: string
}

export interface LecturesType {
    _id: mongoose.Types.ObjectId
    title: string;
    lecture_number:string;
}

export interface ITheoryCourse extends Document {
    title: string;
    module: string;
    subject: string;
    new_launch: boolean;
    thumbnail: string;
    class_name: string;
    price: string;
    old_price: string;
    discount: string;
    language: string;
    display_priority: string;
    description:string[];
    teachers:TeachersType[];
    lectures: LecturesType[];
    createdAt: Date;
    updatedAt: Date;
}

//schema
const TheorySchemaSchema = new Schema<ITheoryCourse>({
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
    language:{
        type: String,
        default: "English",
    },
    display_priority:{
        type: String,
        required: [true, 'Please enter display_priority'],
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
    ],
    lectures: [
        {
            _id: {
                type: Schema.Types.ObjectId,
            },
            title: String,
            lecture_number: String
        }
    ]
}, {timestamps: true})

// model
const TheoryCourse = mongoose.model<ITheoryCourse>('TheoryCourse', TheorySchemaSchema);

//export
export default TheoryCourse;