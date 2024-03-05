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
exports.deleteUser = exports.postUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const userBody_1 = require("./validation/userBody");
const room_1 = __importDefault(require("../models/room"));
exports.postUser = [
    ...userBody_1.user,
    (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req).array();
        if (errors.length) {
            res.status(400).json({ errors });
            return;
        }
        const window = new jsdom_1.JSDOM("").window;
        const DOMPurify = (0, dompurify_1.default)(window);
        const user = DOMPurify.sanitize(req.body["user"]);
        const room = req.documents.roomId;
        if (room.users.length === room.max_user_count) {
            const err = new Error("Room cannot accept a new user as it is full");
            err.status = 403;
            return next(err);
        }
        if (room.users.includes(user)) {
            const err = new Error("User already exists in room");
            err.status = 403;
            return next(err);
        }
        room.users.push(user);
        yield room_1.default.findOneAndUpdate({ _id: room._id }, { users: room.users })
            .lean()
            .exec();
        res.end();
    })),
];
exports.deleteUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userToRemove = req.params["userId"];
    const room = req.documents.roomId;
    if (!room.users.includes(userToRemove)) {
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
    }
    room.users = room.users.filter((user) => user !== userToRemove);
    yield room_1.default.findOneAndUpdate({ _id: room._id }, { users: room.users })
        .lean()
        .exec();
    res.end();
}));
exports.default = {
    postUser: exports.postUser,
    deleteUser: exports.deleteUser
};
