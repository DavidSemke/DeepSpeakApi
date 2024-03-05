"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const express_validator_1 = require("express-validator");
const errorMessage_1 = require("./errorMessage");
const user_1 = __importDefault(require("../../models/constants/user"));
const user = [
    (0, express_validator_1.body)("user")
        .isString()
        .withMessage("User must be a string")
        .trim()
        .isLength(user_1.default.USER_LENGTH)
        .withMessage((value) => {
        return (0, errorMessage_1.invalidLength)("user", value, user_1.default.USER_LENGTH);
    }),
];
exports.user = user;
