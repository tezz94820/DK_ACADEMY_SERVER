"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
//schema
const PYQPDFSchema = new mongoose_1.Schema({
    title: {
        type: String,
        unique: true,
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
    thumbnail: {
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
    free: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: "English",
    },
    display_priority: {
        type: String,
        required: [true, 'Please enter display_priority'],
    },
    pdf_solution: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PdfSolution',
    },
    total_questions: {
        type: String,
        // required: [true, 'Please enter total_questions'],
    }
}, { timestamps: true });
// model
const PYQPDF = mongoose_1.default.model('PyqPDF', PYQPDFSchema);
//export
exports.default = PYQPDF;
//# sourceMappingURL=PyqPDF.js.map