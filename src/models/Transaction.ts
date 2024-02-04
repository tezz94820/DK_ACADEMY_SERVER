import mongoose, { Schema, Document, Model  } from 'mongoose';

//typescript types
export interface ITransaction extends Document {
    student_id: Schema.Types.ObjectId;
    product_type: string;
    product_id: Schema.Types.ObjectId;
    amount: string;
    status: string;
    order_id: string;
    razorpay_payload?: any
    createdAt: Date;
    updatedAt: Date;
}

//schema
const TransactionSchema = new Schema<ITransaction>({
    student_id: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: [true, 'Please enter the student id']
    },
    product_type: {
        type: String,
        enum:['pyq','theory'],
        required: [true, 'Please enter the product type']
    },
    product_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Please enter the product id']
    },
    amount: {
        type: String,
        required: [true, 'Please enter the amount']
    },
    order_id: {
        type: String,
        required: [true, 'Please enter the order id']
    },
    status:{
        type: String,
        enum:['started','success','failed'],
    },
    razorpay_payload:{
        type: Object
    }


}, {timestamps: true})

// model
const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

//export
export default Transaction;