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
exports.deploySockets = void 0;
const socket_io_1 = require("socket.io");
const room_1 = __importDefault(require("../models/room"));
function deploySockets(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*'
        }
    });
    io.on('connection', (socket) => {
        socket.on('post-message', ({ roomId }) => __awaiter(this, void 0, void 0, function* () {
            const room = yield room_1.default
                .findById(roomId)
                .lean()
                .populate('messages')
                .exec();
            io.to(roomId).emit('room-update', { room });
        }));
        socket.on('join-room', ({ roomId, update }) => __awaiter(this, void 0, void 0, function* () {
            socket.join(roomId);
            if (update) {
                const room = yield room_1.default
                    .findById(roomId)
                    .lean()
                    .populate('messages')
                    .exec();
                io.to(roomId).emit('room-update', { room });
            }
        }));
        socket.on('leave-room', ({ roomId, update }) => __awaiter(this, void 0, void 0, function* () {
            if (update) {
                const room = yield room_1.default
                    .findById(roomId)
                    .lean()
                    .populate('messages')
                    .exec();
                io.to(roomId).emit('room-update', { room });
            }
            socket.leave(roomId);
        }));
    });
}
exports.deploySockets = deploySockets;
