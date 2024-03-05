"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagination = exports.messageSort = exports.roomSort = void 0;
const express_validator_1 = require("express-validator");
const message_1 = __importDefault(require("../../models/message"));
const room_1 = __importDefault(require("../../models/room"));
const notStringErrMsg = (param) => {
    return `Query param '${param}' must be a string`;
};
function validateSort(model) {
    const orders = ["asc", "desc"];
    return [
        (0, express_validator_1.query)("order-by")
            .optional()
            .isString()
            .withMessage(notStringErrMsg("order-by"))
            .trim()
            .custom((value) => {
            return value in model.schema.paths;
        })
            .withMessage(`Query param 'order-by' does not ref a prop of schema '${model.modelName}'`),
        (0, express_validator_1.query)("order")
            .optional()
            .isString()
            .withMessage(notStringErrMsg("order"))
            .trim()
            .custom((value, { req }) => {
            return req.query && req.query["order-by"] !== undefined;
        })
            .withMessage(`Query param 'order' exists without query param 'order-by'`)
            .custom((value) => {
            return orders.includes(value);
        })
            .withMessage(`Query param 'order' must be in [${orders}]`),
    ];
}
function validatePagination() {
    const notOnlyDigitsErrMsg = (param) => {
        return `Query param '${param}' must only consist of digits`;
    };
    const onlyDigitsRegex = /^\d+$/;
    return [
        (0, express_validator_1.query)("limit")
            .optional()
            .isString()
            .withMessage(notStringErrMsg("limit"))
            .trim()
            .custom((value) => {
            return onlyDigitsRegex.test(value);
        })
            .withMessage(notOnlyDigitsErrMsg("limit")),
        (0, express_validator_1.query)("offset")
            .optional()
            .isString()
            .withMessage(notStringErrMsg("offset"))
            .trim()
            .custom((value) => {
            return onlyDigitsRegex.test(value);
        })
            .withMessage(notOnlyDigitsErrMsg("offset")),
    ];
}
const roomSort = validateSort(room_1.default);
exports.roomSort = roomSort;
const messageSort = validateSort(message_1.default);
exports.messageSort = messageSort;
const pagination = validatePagination();
exports.pagination = pagination;
