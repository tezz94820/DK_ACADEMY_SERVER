"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Set up storage for file uploads
const storage = multer_1.default.memoryStorage(); // You can customize the storage as per your needs
// Set up Multer middleware with file size limits and storage configuration
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 5MB limit (adjust as needed)
    },
    fileFilter: (req, file, cb) => {
        // Add file type validation here if needed
        if (file.mimetype.startsWith('application/pdf') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    },
});
exports.upload = upload;
//# sourceMappingURL=multer.js.map