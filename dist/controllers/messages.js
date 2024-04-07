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
exports.getMessage = exports.postMessage = exports.getManyMessages = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const message_1 = __importDefault(require("../models/message"));
const room_1 = __importDefault(require("../models/room"));
const room_2 = __importDefault(require("../models/constants/room"));
const many_1 = __importDefault(require("./query/many"));
const getManyMessages = (req, res, next) => {
    const room = req.documents.roomId;
    many_1.default.findMany(message_1.default, { _id: { $in: room.messages } })(req, res, next);
};
exports.getManyMessages = getManyMessages;
exports.postMessage = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req).array();
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }
    const window = new jsdom_1.JSDOM("").window;
    const DOMPurify = (0, dompurify_1.default)(window);
    const content = DOMPurify.sanitize(req.body["content"]);
    const room = req.documents.roomId;
    // Remove oldest message if at message capacity
    if (room.messages.length === room_2.default.MESSAGES_LENGTH.max) {
        room.messages.shift();
    }
    const data = {
        content,
        user: req.user.username,
        create_date: Date.now(),
    };
    const message = yield message_1.default.create(data);
    room.messages.push(message._id);
    yield room_1.default.findOneAndUpdate({ _id: room._id }, { messages: room.messages })
        .lean()
        .exec();
    res.json({ message: message.toObject() });
}));
function getMessage(req, res, next) {
    const room = req.documents.roomId;
    const message = req.documents.messageId;
    const roomMsgStrIds = room.messages
        .map((msg) => msg.toString());
    if (!roomMsgStrIds.includes(message._id.toString())) {
        const err = new Error("Message does not belong to room");
        err.status = 403;
        return next(err);
    }
    res.json({ message });
}
exports.getMessage = getMessage;
exports.default = {
    getManyMessages: exports.getManyMessages,
    postMessage: exports.postMessage,
    getMessage,
};
