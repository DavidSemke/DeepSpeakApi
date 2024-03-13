"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateAuthToken(user, hoursToLive = 24) {
    return jsonwebtoken_1.default.sign(user, process.env.TOKEN_SECRET, { expiresIn: hoursToLive + 'h' });
}
exports.generateAuthToken = generateAuthToken;
