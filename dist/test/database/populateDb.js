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
const room_1 = __importDefault(require("../../models/room"));
const message_1 = __importDefault(require("../../models/message"));
const messageData_1 = __importDefault(require("./documents/messageData"));
const roomData_1 = __importDefault(require("./documents/roomData"));
const rooms = [];
const messages = [];
function populate() {
    return __awaiter(this, void 0, void 0, function* () {
        const messageDocs = messageData_1.default.getData();
        yield createMessages(messageDocs);
        const roomDocs = roomData_1.default.getData(messages);
        yield createRooms(roomDocs);
    });
}
function roomCreate(index, roomData) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = new room_1.default(roomData);
        yield room.save();
        rooms[index] = room;
    });
}
function messageCreate(index, messageData) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = new message_1.default(messageData);
        yield message.save();
        messages[index] = message;
    });
}
function createMessages(messageData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(messageData.map((data, index) => {
            return messageCreate(index, data);
        }));
    });
}
function createRooms(roomData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(roomData.map((data, index) => {
            return roomCreate(index, data);
        }));
    });
}
exports.default = populate;
