"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idValidation = exports.roomPopulationValidation = exports.paginationValidation = exports.messageSortValidation = exports.roomSortValidation = void 0;
const express_validator_1 = require("express-validator");
const message_1 = __importDefault(require("../../models/message"));
const room_1 = __importDefault(require("../../models/room"));
const urlParams_1 = require("./urlParams");
const notTypeErrMsg = (param, type) => {
    return `Query param '${param}' must be a ${type}`;
};
const notSchemaPropErrMsg = (param, modelName) => {
    return `Query param '${param}' does not ref a prop of schema '${modelName}'`;
};
function validateSort(model) {
    const orders = ["asc", "desc"];
    return [
        (0, express_validator_1.query)("order-by")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("order-by", 'string'))
            .trim()
            .custom((value) => {
            return value in model.schema.paths;
        })
            .withMessage(notSchemaPropErrMsg('order-by', model.modelName)),
        (0, express_validator_1.query)("order")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("order", 'string'))
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
function validatepaginationValidation() {
    const notOnlyDigitsErrMsg = (param) => {
        return `Query param '${param}' must only consist of digits`;
    };
    const onlyDigitsRegex = /^\d+$/;
    return [
        (0, express_validator_1.query)("limit")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("limit", 'string'))
            .trim()
            .custom((value) => {
            return onlyDigitsRegex.test(value);
        })
            .withMessage(notOnlyDigitsErrMsg("limit")),
        (0, express_validator_1.query)("offset")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("offset", 'string'))
            .trim()
            .custom((value) => {
            return onlyDigitsRegex.test(value);
        })
            .withMessage(notOnlyDigitsErrMsg("offset")),
    ];
}
function validatePopulation(model) {
    return [
        (0, express_validator_1.query)("populate")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("offset", 'string'))
            .trim()
            .custom((value) => {
            return value in model.schema.paths;
        })
            .withMessage((value) => notSchemaPropErrMsg(value, model.modelName)),
    ];
}
function validateIds() {
    return [
        (0, express_validator_1.query)("ids")
            .optional()
            .isString()
            .withMessage(notTypeErrMsg("ids", 'string'))
            .trim()
            .custom((value) => {
            const ids = value.split(',');
            for (const id of ids) {
                if ((0, urlParams_1.plainObjectIdValidation)(id).length) {
                    return false;
                }
            }
            return true;
        })
            .withMessage('Invalid ObjectId format')
    ];
}
const roomSortValidation = validateSort(room_1.default);
exports.roomSortValidation = roomSortValidation;
const messageSortValidation = validateSort(message_1.default);
exports.messageSortValidation = messageSortValidation;
const paginationValidation = validatepaginationValidation();
exports.paginationValidation = paginationValidation;
const roomPopulationValidation = validatePopulation(room_1.default);
exports.roomPopulationValidation = roomPopulationValidation;
const idValidation = validateIds();
exports.idValidation = idValidation;
