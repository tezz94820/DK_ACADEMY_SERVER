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
exports.decode = exports.encode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// First we get our unique key to encrypt our object
var password = process.env.CRYPT_PASSWORD;
// We then get our unique Initialization Vector
var iv = Buffer.from(process.env.CRYPT_IV, 'hex'); // Parse IV from hex string
// Function to find SHA1 Hash of password key
function sha1(input) {
    return crypto_1.default.createHash('sha1').update(input).digest();
}
// Function to get secret key for encryption and decryption using the password
function password_derive_bytes(password, salt, iterations, len) {
    var key = Buffer.from(password + salt);
    for (var i = 0; i < iterations; i++) {
        key = sha1(key);
    }
    if (key.length < len) {
        var hx = password_derive_bytes(password, salt, iterations - 1, 20);
        for (var counter = 1; key.length < len; ++counter) {
            key = Buffer.concat([key, sha1(Buffer.concat([Buffer.from(counter.toString()), hx]))]);
        }
    }
    return Buffer.alloc(len, key);
}
// Function to encode the object
function encode(string) {
    return __awaiter(this, void 0, void 0, function* () {
        var key = password_derive_bytes(password, '', 100, 32);
        // Initialize Cipher Object to encrypt using AES-256 Algorithm 
        var cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
        var part1 = cipher.update(string, 'utf8');
        var part2 = cipher.final();
        const encrypted = Buffer.concat([part1, part2]).toString('base64');
        return encrypted;
    });
}
exports.encode = encode;
// Function to decode the object
function decode(string) {
    return __awaiter(this, void 0, void 0, function* () {
        var key = password_derive_bytes(password, '', 100, 32);
        // Initialize decipher Object to decrypt using AES-256 Algorithm
        var decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
        var decrypted = decipher.update(string, 'base64', 'utf8');
        decrypted += decipher.final();
        return decrypted;
    });
}
exports.decode = decode;
//# sourceMappingURL=crypt.js.map