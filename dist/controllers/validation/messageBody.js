"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = void 0;
const express_validator_1 = require("express-validator");
const errorMessage_1 = require("./errorMessage");
const userBody_1 = require("./userBody");
const message_1 = __importDefault(require("../../models/constants/message"));
const message = [
    ...userBody_1.user,
    (0, express_validator_1.body)("content")
        .isString()
        .withMessage("Content must be a string")
        .trim()
        .isLength(message_1.default.CONTENT_LENGTH)
        .withMessage((value) => {
        return (0, errorMessage_1.invalidLength)("content", value, message_1.default.CONTENT_LENGTH);
    }),
];
exports.message = message;
