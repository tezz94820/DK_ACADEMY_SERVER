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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
    },
    password: {
        type: String,
        required: [true, 'Please provide a password']
    },
    OtpAttemptCount: {
        type: String,
        default: '0'
    },
    lastOtpRequestTime: {
        type: Date
    }
}, { timestamps: true });
//                                       instance Methods
StudentSchema.method('fullName', function fullName() {
    return this.first_name + ' ' + this.last_name;
});
//comparing the password by bcrypt
StudentSchema.method('comparePassword', function (userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcrypt_1.default.compare(userPassword, this.password);
        return isMatch;
    });
});
//creating token
StudentSchema.method('generateAuthToken', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const token = jsonwebtoken_1.default.sign({ userId: this._id, username: this.fullName() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
        return token;
    });
});
//                                                  middlewares
//encryption of the password using pre mongoose middleware.
//password => pre middleware does encryption => encrypted password saved in the database.
// StudentSchema.pre('save' , async function(req,res)  {
//     const salt = await bcrypt.genSalt(10);                   
//     this.password = await bcrypt.hash(this.password,salt)   
// }) 
//                                                  model
const Student = mongoose_1.default.model('Student', StudentSchema);
//export
exports.default = Student;
//# sourceMappingURL=Student.js.map