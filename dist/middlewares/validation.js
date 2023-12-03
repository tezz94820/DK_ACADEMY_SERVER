"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAsSchema = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const validateAsSchema = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: true });
        if (error) {
            const errorMessage = error.details[0].message;
            return (0, ApiResponse_1.sendError)(res, 400, errorMessage, { error });
        }
        next();
    };
};
exports.validateAsSchema = validateAsSchema;
//# sourceMappingURL=validation.js.map