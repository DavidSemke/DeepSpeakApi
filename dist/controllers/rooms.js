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
exports.getRoom = exports.postRoom = exports.getManyRooms = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_validator_1 = require("express-validator");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const room_1 = __importDefault(require("../models/room"));
const queryParams_1 = require("./validation/queryParams");
const roomBody_1 = require("./validation/roomBody");
const many_1 = __importDefault(require("./query/many"));
exports.getManyRooms = [
    ...queryParams_1.roomSort,
    ...queryParams_1.pagination,
    many_1.default.findMany(room_1.default),
];
exports.postRoom = [
    ...roomBody_1.room,
    (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req).array();
        if (errors.length) {
            res.status(400).json({ errors });
            return;
        }
        const window = new jsdom_1.JSDOM("").window;
        const DOMPurify = (0, dompurify_1.default)(window);
        const topic = DOMPurify.sanitize(req.body["topic"]);
        const maxUserCount = DOMPurify.sanitize(req.body["max-user-count"]);
        const createDate = new Date();
        const deleteDate = new Date(createDate.getTime());
        // Set time to live to 24 hours
        deleteDate.setHours(deleteDate.getHours() + 24);
        const data = {
            topic,
            create_date: createDate,
            delete_date: deleteDate,
            max_user_count: Number(maxUserCount),
            users: [],
            messages: [],
        };
        yield room_1.default.create(data);
        res.end();
    })),
];
function getRoom(req, res, next) {
    res.json({ room: req.documents.roomId });
}
exports.getRoom = getRoom;
exports.default = {
    getManyRooms: exports.getManyRooms,
    postRoom: exports.postRoom,
    getRoom,
};
