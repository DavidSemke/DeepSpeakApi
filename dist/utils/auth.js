"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.generateAuthToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateAuthToken(user, hoursToLive = 24) {
    if (process.env.NODE_ENV === 'production') {
        return jsonwebtoken_1.default.sign(user, process.env.TOKEN_SECRET, { expiresIn: hoursToLive + 'h' });
    }
    return jsonwebtoken_1.default.sign(user, process.env.TOKEN_SECRET);
}
exports.generateAuthToken = generateAuthToken;
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        const err = new Error('Json web token could not be authenticated');
        err.status = 401;
        return next(err);
    }
    jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        const errMsgTrunk = 'Request could not be authorized';
        if (err) {
            const err = new Error(errMsgTrunk);
            err.status = 403;
            return next(err);
        }
        const room = req.documents.roomId;
        if (room.deleted_users.includes(user.username)) {
            const err = new Error(`${errMsgTrunk}; user was deleted from room`);
            err.status = 403;
            return next(err);
        }
        if (room._id.toString() !== user.roomId.toString()
            || !room.users.includes(user.username)) {
            const err = new Error(`${errMsgTrunk}; user not in requested room`);
            err.status = 403;
            return next(err);
        }
        req.user = user;
        next();
    });
}
exports.authenticateToken = authenticateToken;
