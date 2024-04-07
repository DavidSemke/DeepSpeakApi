"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rooms_1 = __importDefault(require("../controllers/rooms"));
const multer_1 = require("./utils/multer");
const objectId_1 = require("./utils/objectId");
const room_1 = __importDefault(require("../models/room"));
const queryParams_1 = require("./validation/queryParams");
const roomBody_1 = require("./validation/roomBody");
const router = (0, express_1.Router)();
router.use("/:roomId", (0, objectId_1.setObjectIdDocument)("params", "roomId", room_1.default, ["messages"]));
router.get("/", queryParams_1.roomSortValidation, queryParams_1.paginationValidation, queryParams_1.roomPopulationValidation, queryParams_1.idValidation, rooms_1.default.getManyRooms);
router.post("/", multer_1.upload.none(), roomBody_1.roomValidation, rooms_1.default.postRoom);
router.get("/:roomId", rooms_1.default.getRoom);
exports.default = router;
