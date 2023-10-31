"use strict";
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
const axios_1 = __importDefault(require("axios"));
const URL = 'https://www.fast2sms.com/dev/bulkV2';
const sendOtp = (otp, phone) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(URL, {}, {
            headers: {
                "authorization": process.env.FAST2SMS_API_KEY
            },
            params: {
                variables_values: otp,
                route: "otp",
                numbers: phone,
            },
        });
        return response.data;
    }
    catch (error) {
        console.log(error);
    }
});
exports.default = sendOtp;
//# sourceMappingURL=sendOtp.js.map