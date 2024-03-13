"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messages_1 = __importDefault(require("../controllers/messages"));
const message_1 = __importDefault(require("../models/message"));
const multer_1 = require("./utils/multer");
const objectId_1 = require("./utils/objectId");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.use("/:messageId", (0, objectId_1.setObjectIdDocument)("params", "messageId", message_1.default));
router.get("/", messages_1.default.getManyMessages);
router.post("/", auth_1.authenticateToken, multer_1.upload.none(), messages_1.default.postMessage);
router.get("/:messageId", messages_1.default.getMessage);
exports.default = router;
