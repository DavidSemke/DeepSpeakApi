"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("../controllers/users"));
const multer_1 = require("./utils/multer");
const router = (0, express_1.Router)();
router.post("/", multer_1.upload.none(), users_1.default.postUser);
router.delete("/:userId", users_1.default.deleteUser);
exports.default = router;
