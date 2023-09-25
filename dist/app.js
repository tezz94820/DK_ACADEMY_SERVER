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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const corsOptions_1 = __importDefault(require("./utils/corsOptions"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const indexRoute_1 = __importDefault(require("./routes/indexRoute"));
const connect_1 = __importDefault(require("./db/connect"));
const app = (0, express_1.default)();
dotenv_1.default.config();
//middlewares
app.use((0, cors_1.default)(corsOptions_1.default));
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '10kb' })); //body data to json
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' })); //urlencoded data
//development middlewares
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
//routes
app.use('/api/v1', indexRoute_1.default);
//starting the server
const port = process.env.PORT;
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, connect_1.default)(process.env.MONGO_URI);
        app.listen(port, () => console.log(`Listening on port ${port}`));
    }
    catch (error) {
        console.log(error.message);
    }
});
start();
//# sourceMappingURL=app.js.map