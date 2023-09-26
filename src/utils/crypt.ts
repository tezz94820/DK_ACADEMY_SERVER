import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// First we get our unique key to encrypt our object
var password = process.env.CRYPT_PASSWORD;

// We then get our unique Initialization Vector
var iv =  Buffer.from(process.env.CRYPT_IV, 'hex'); // Parse IV from hex string

// Function to find SHA1 Hash of password key
function sha1(input) {
    return crypto.createHash('sha1').update(input).digest();
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
async function encode(string) {
    var key = password_derive_bytes(password, '', 100, 32);
    // Initialize Cipher Object to encrypt using AES-256 Algorithm 
    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    var part1 = cipher.update(string, 'utf8');
    var part2 = cipher.final();
    const encrypted = Buffer.concat([part1, part2]).toString('base64');
    return encrypted;
}

// Function to decode the object
async function decode(string) {
    var key = password_derive_bytes(password, '', 100, 32);
    // Initialize decipher Object to decrypt using AES-256 Algorithm
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    var decrypted = decipher.update(string, 'base64', 'utf8');
    decrypted += decipher.final();
    return decrypted;
}

export { encode, decode };
