"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const connecter = process.env.MONGO_DB_CONNECT;
mongoose_1.default.connect(connecter);
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "mongo connection error"));
