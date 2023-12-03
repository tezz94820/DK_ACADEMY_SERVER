"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdf_1 = require("../controllers/pdf");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get('/subject/:subject', pdf_1.getPdfBySubject);
router.get('/pdf', auth_1.Protect, pdf_1.getPdfPage);
router.get('/solution', auth_1.Protect, pdf_1.getpdfSolution);
router.get('/individual-solution', auth_1.Protect, pdf_1.getPdfSolutionByQuestion);
exports.default = router;
//# sourceMappingURL=pdfRoutes.js.map