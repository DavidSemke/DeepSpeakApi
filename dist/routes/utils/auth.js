"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInRoomCheck = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        const err = new Error('Json web token could not be authenticated');
        err.status = 401;
        return next(err);
    }
    jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) {
            const err = new Error('Request could not be authorized');
            err.status = 403;
            return next(err);
        }
        req.user = user;
        next();
    });
}
exports.authenticateToken = authenticateToken;
function userInRoomCheck(req, res, next) {
    const room = req.documents.roomId;
    if (room._id.toString() !== req.user.roomId.toString()) {
        const err = new Error('Request could not be authorized; user is not in requested room');
        err.status = 403;
        return next(err);
    }
    next();
}
exports.userInRoomCheck = userInRoomCheck;
