"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const cors_1 = __importDefault(require("cors"));
const room_1 = __importDefault(require("./models/room"));
const objectId_1 = require("./routes/utils/objectId");
const rooms_1 = __importDefault(require("./routes/rooms"));
const messages_1 = __importDefault(require("./routes/messages"));
const users_1 = __importDefault(require("./routes/users"));
require("./mongoConfig");
const isProduction = process.env.NODE_ENV === "production";
function App() {
    const app = (0, express_1.default)();
    if (isProduction) {
        /* Security Setup */
        app.use((0, helmet_1.default)());
        /* Rate limiting */
        app.use(
        // 20 requests per minute
        (0, express_rate_limit_1.default)({
            windowMs: 1 * 60 * 1000,
            max: 20,
        }));
        /* Response compression */
        app.use((0, compression_1.default)());
    }
    // Enable CORS
    app.use((0, cors_1.default)());
    /* Miscellaneous Setup */
    app.use((0, morgan_1.default)("dev"));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: false }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_mongo_sanitize_1.default)());
    /* Route Setup */
    app.use((req, res, next) => {
        req.documents = {};
        next();
    });
    const setNoPopulateRoom = (0, objectId_1.setObjectIdDocument)("params", "roomId", room_1.default);
    // Make sure less specific routes come after more specific
    // E.g. /rooms must come after all of its extensions
    app.use("/rooms/:roomId/messages", setNoPopulateRoom, messages_1.default);
    app.use("/rooms/:roomId/users", setNoPopulateRoom, users_1.default);
    app.use("/rooms", rooms_1.default);
    /* Error Handling */
    app.use(function (req, res, next) {
        const err = new Error('Resource not found');
        err.status = 404;
        next(err);
    });
    app.use(function (err, req, res, next) {
        const status = err.status || 500;
        let msg = 'Internal Server Error';
        if (status !== 500) {
            msg = err.message;
        }
        const errors = [{ message: msg }];
        res.status(status).json({ errors });
    });
    return app;
}
exports.default = App;
