"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.room = void 0;
const express_validator_1 = require("express-validator");
const errorMessage_1 = require("./errorMessage");
const room_1 = __importDefault(require("../../models/constants/room"));
const room = [
    (0, express_validator_1.body)("topic")
        .isString()
        .withMessage("Topic must be a string")
        .trim()
        .isLength(room_1.default.TOPIC_LENGTH)
        .withMessage((value) => {
        return (0, errorMessage_1.invalidLength)("topic", value, room_1.default.TOPIC_LENGTH);
    }),
    (0, express_validator_1.body)("max-user-count")
        .isNumeric()
        .withMessage("Max user count must be numeric")
        .custom((value) => {
        const count = parseInt(value);
        const { min, max } = room_1.default.MAX_USER_COUNT_LENGTH;
        return count >= min && count <= max;
    })
        .withMessage(() => {
        const { min, max } = room_1.default.MAX_USER_COUNT_LENGTH;
        return `Max user count must be in range [${min}, ${max}]`;
    }),
];
exports.room = room;
