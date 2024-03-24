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
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
function findMany(model, filter = {}, usePopulation = false) {
    return (0, express_async_handler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req).array();
        if (errors.length) {
            res.status(400).json({ errors });
            return;
        }
        const orderBy = req.query["order-by"];
        const limit = Number(req.query["limit"]);
        const offset = Number(req.query["offset"]);
        const populate = req.query['populate'];
        const query = model.find(filter).lean();
        if (typeof orderBy === "string") {
            const order = req.query["order"];
            let sortStr = orderBy;
            if (order === "desc") {
                sortStr = "-" + orderBy;
            }
            query.sort(sortStr);
        }
        if (limit) {
            query.limit(limit);
        }
        if (offset) {
            query.skip(offset);
        }
        if (usePopulation
            && typeof populate === 'string') {
            query.populate(populate);
        }
        const documents = yield query.exec();
        const documentType = model.modelName.toLowerCase();
        const plural = documentType + "_collection";
        res.json({ [plural]: documents });
    }));
}
module.exports = {
    findMany,
};
