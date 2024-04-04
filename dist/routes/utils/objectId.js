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
exports.objectIdValidation = exports.setObjectIdDocument = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
function setObjectIdDocument(reqObject, reqObjectKey, model, populatePaths = []) {
    let reqObjectValidator;
    if (reqObject === "params") {
        reqObjectValidator = express_validator_1.param;
    }
    else if (reqObject === "body") {
        reqObjectValidator = express_validator_1.body;
    }
    else {
        throw new Error("Param reqObject must be in ['params, body']");
    }
    return [
        objectIdValidation(reqObjectValidator, reqObjectKey),
        (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req).array();
            if (errors.length) {
                res.status(400).json({ errors });
                return;
            }
            const objectId = req[reqObject][reqObjectKey];
            const query = model.findById(objectId).lean();
            for (const path of populatePaths) {
                query.populate(path);
            }
            const document = yield query.exec();
            if (document === null) {
                const err = new Error("Resource not found");
                err.status = 404;
                return next(err);
            }
            req.documents[reqObjectKey] = document;
            next();
        })),
    ];
}
exports.setObjectIdDocument = setObjectIdDocument;
function objectIdValidation(reqObjectValidator, reqObjectKey) {
    return reqObjectValidator(reqObjectKey)
        .isString()
        .withMessage("ObjectId must be a string")
        .trim()
        .custom((value) => {
        // Must be a 24-character, lowercase, hexadecimal string
        const hexRegex = /^[a-f\d]{24}$/;
        return hexRegex.test(value);
    })
        .withMessage("Invalid ObjectId format");
}
exports.objectIdValidation = objectIdValidation;
