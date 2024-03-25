"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = __importDefault(require("../../../models/constants/room"));
const inputData = [
    {
        topic: "Sad gerbil",
    },
    {
        topic: "Glad squirrel",
    },
    {
        topic: "Bad hurtle",
    },
    {
        topic: "Mad turtle",
    },
    {
        topic: "Fad purple",
    },
    {
        topic: "Lad circle",
    },
];
function getData(messages) {
    if (messages.length < room_1.default.MESSAGES_LENGTH.max) {
        throw new Error("Not enough unique messages to meet max messages length");
    }
    const baseDate = new Date();
    const completeData = inputData.map((data, index) => {
        const createDate = new Date(baseDate.getTime());
        const deleteDate = new Date(baseDate.getTime());
        deleteDate.setHours(baseDate.getHours() + 24);
        // At least one message to a room (empty room case insignificant)
        const messageSlice = messages.slice(index % messages.length);
        const users = [];
        for (const msg of messageSlice) {
            if (!users.includes(msg.user)) {
                users.push(msg.user);
            }
        }
        return Object.assign(Object.assign({}, data), { create_date: createDate, delete_date: deleteDate, max_user_count: Math.min(users.length + index * 2, room_1.default.MAX_USER_COUNT_LENGTH.max), users, deleted_users: ['deletedUser' + index], messages: messageSlice.map((msg) => msg._id) });
    });
    return completeData;
}
exports.default = {
    getData,
};
