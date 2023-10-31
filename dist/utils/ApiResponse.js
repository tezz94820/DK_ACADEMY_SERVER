"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, code, message, data) => {
    const sendData = {
        code,
        message,
        data
    };
    res.status(code).json(sendData);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, code, message, error) => {
    const sendData = {
        code,
        message,
        error
    };
    res.status(code).json(sendData);
};
exports.sendError = sendError;
//# sourceMappingURL=ApiResponse.js.map