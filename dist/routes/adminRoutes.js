"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdf_1 = require("../controllers/pdf");
const validation_1 = require("../middlewares/validation");
const pdf_2 = require("../validations/pdf");
const auth_1 = require("../middlewares/auth");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router();
const multer = multer_1.upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 },
]);
router.post('/pyq-pdf', auth_1.Protect, (0, validation_1.validateAsSchema)(pdf_2.createPdfValidationSchema), pdf_1.createPdf);
router.post('/create-pdf-solution', auth_1.Protect, pdf_1.createPdfSolution);
router.post('/upload-solution', auth_1.Protect, multer, pdf_1.uploadSolutionContent);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map