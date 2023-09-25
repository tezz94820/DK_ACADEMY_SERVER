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
const StudentSchema = new mongoose_1.Schema({
    first_name: {
        type: String,
        required: [true, 'please enter first name']
    },
    last_name: {
        type: String,
        required: [true, 'please enter first name']
    },
    email: {
        type: String,
        required: [true, 'Please enter the email'],
        unique: true,
        validate: {
            validator: function (v) {
                return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v);
            },
            message: 'Invalid Email!'
        }
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        validate: {
            validator: function (v) {
                // return /d{10}/.test(v);
                return /^[1-9]\d{9}$/.test(v);
            },
            message: 'Invalid Phone Number!'
        }
    },
    phone_verified: {
        type: Boolean,
        default: false
    },
    email_verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
//instance Methods
StudentSchema.method('fullName', function fullName() {
    return this.first_name + ' ' + this.last_name;
});
//model
const Student = mongoose_1.default.model('Student', StudentSchema);
//export
exports.default = Student;
//# sourceMappingURL=Student.js.map