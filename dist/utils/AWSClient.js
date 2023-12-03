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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToFolderInS3 = exports.createPresignedUrlByKey = exports.createFolder = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const stream_1 = require("stream");
const bucket = "dkacademy.store";
const AWSClient = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const createFolder = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    const response = yield AWSClient.send(command);
    if (response)
        return true;
    else
        return false;
});
exports.createFolder = createFolder;
// const createPresignedPdf
const createPresignedUrlByKey = (key, expiresIn) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: "dkacademy.store",
        Key: key
    });
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(AWSClient, command, { expiresIn: expiresIn });
    return url;
});
exports.createPresignedUrlByKey = createPresignedUrlByKey;
const uploadFileToFolderInS3 = (file, key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bufferStream = new stream_1.PassThrough();
        bufferStream.end(file.buffer);
        const params = {
            Bucket: bucket,
            Key: key,
            Body: bufferStream,
            ContentType: file.mimetype,
        };
        // const command = new PutObjectCommand(params);
        // await AWSClient.send(command);
        const upload = new lib_storage_1.Upload({ client: AWSClient, params });
        yield upload.done();
        return true;
    }
    catch (error) {
        console.error("Error uploading file to S3:", error);
        return false;
    }
});
exports.uploadFileToFolderInS3 = uploadFileToFolderInS3;
//# sourceMappingURL=AWSClient.js.map