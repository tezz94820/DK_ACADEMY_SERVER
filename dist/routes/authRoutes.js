"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../controllers/auth"));
const auth_2 = require("../validations/auth");
const validation_1 = require("../middlewares/validation");
const router = express_1.default.Router();
router.post('/register', (0, validation_1.validateAsSchema)(auth_2.registerValidationSchema), auth_1.default.register);
router.post('/login', (0, validation_1.validateAsSchema)(auth_2.loginValidationSchema), auth_1.default.login);
router.post('/otp/phone', (0, validation_1.validateAsSchema)(auth_2.getOtpValidationSchema), auth_1.default.getOtp);
// router.post('/otp/email', authController.getOtpEmail);
router.post('/otp/verify', (0, validation_1.validateAsSchema)(auth_2.verifyOtpValidationSchema), auth_1.default.verifyOtp);
router.post('/changepassword', auth_1.default.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map