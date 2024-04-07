"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plainObjectIdValidation = exports.objectIdValidation = void 0;
const stringErrMsg = "ObjectId must be a string";
const formatErrMsg = "Invalid ObjectId format";
const hexRegex = /^[a-f\d]{24}$/;
function objectIdValidation(reqObjectValidator, reqObjectKey) {
    return reqObjectValidator(reqObjectKey)
        .isString()
        .withMessage(stringErrMsg)
        .trim()
        .custom((value) => {
        // Must be a 24-character, lowercase, hexadecimal string
        return hexRegex.test(value);
    })
        .withMessage(formatErrMsg);
}
exports.objectIdValidation = objectIdValidation;
function plainObjectIdValidation(objectId) {
    const errors = [];
    if (typeof objectId !== 'string') {
        errors.push(stringErrMsg);
        return errors;
    }
    const trimmedObjectId = objectId.trim();
    if (!hexRegex.test(trimmedObjectId)) {
        errors.push(formatErrMsg);
    }
    return errors;
}
exports.plainObjectIdValidation = plainObjectIdValidation;
