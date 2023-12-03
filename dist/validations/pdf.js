"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const createPdfValidationSchema = joi_1.default.object({
    title: joi_1.default.string().required().messages({
        "any.required": "Title is required.",
        "string.empty": "Title cannot be empty.",
    }),
    module: joi_1.default.string().required().messages({
        "any.required": "Title is required.",
        "string.empty": "Title cannot be empty.",
    }),
    subject: joi_1.default.string().required().messages({
        "any.required": "subject is required.",
        "string.empty": "subject cannot be empty.",
    }),
    new_launch: joi_1.default.boolean().messages({
        "boolean.base": 'The new_launch field must be a boolean value',
    }),
    thumbnail: joi_1.default.string().required().messages({
        "any.required": "Thumbnail url is required.",
        "string.empty": "Thumbnail url cannot be empty.",
    }),
    class_name: joi_1.default.string().required().messages({
        "any.required": "class is required.",
        "string.empty": "class cannot be empty.",
    }),
    price: joi_1.default.string().pattern(new RegExp("^[1-9]\\d*$")).required().messages({
        "any.required": "price is required.",
        "string.pattern.base": "Price should contains only numerical values",
    }),
    old_price: joi_1.default.string().pattern(new RegExp("^[1-9]\\d*$")).required().messages({
        "any.required": "old_price is required.",
        "string.pattern.base": "old_Price should contains only numerical values",
    }),
    content_link: joi_1.default.string().messages({
        "string.base": 'The free field must be a boolean value',
    }),
    free: joi_1.default.boolean().messages({
        "boolean.base": 'The free field must be a boolean value',
    }),
    language: joi_1.default.string().messages({
        "string.base": 'The free field must be a boolean value',
    }),
    display_priority: joi_1.default.string().messages({
        "any.required": "display_priority is required.",
        "string.empty": "display_priority cannot be empty.",
    }),
});
exports.createPdfValidationSchema = createPdfValidationSchema;
//# sourceMappingURL=pdf.js.map