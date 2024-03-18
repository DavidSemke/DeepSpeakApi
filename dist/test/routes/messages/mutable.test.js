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
const supertest_1 = __importDefault(require("supertest"));
const room_1 = __importDefault(require("../../../models/room"));
const objectId_1 = require("../../../routes/utils/objectId");
const setupTeardown_1 = __importDefault(require("../setupTeardown"));
const messages_1 = __importDefault(require("../../../routes/messages"));
const room_2 = __importDefault(require("../../../models/constants/room"));
const auth_1 = require("../../../utils/auth");
let server, app;
// fewMessagesRoom is default room
// maxMessagesRoom is only used when max messages required
let maxMessagesRoom;
let fewMessagesRoom;
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    const setup = yield setupTeardown_1.default.appSetup(messages_1.default, "/rooms/:roomId/messages", (0, objectId_1.setObjectIdDocument)("params", "roomId", room_1.default));
    server = setup.server;
    app = setup.app;
    const results = yield Promise.all([
        room_1.default.findOne({
            messages: { $size: room_2.default.MESSAGES_LENGTH.max },
        })
            .populate('messages')
            .lean()
            .exec(),
        room_1.default.findOne({
            $where: `this.messages.length < ${room_2.default.MESSAGES_LENGTH.max}`,
        })
            .populate('messages')
            .lean()
            .exec(),
    ]);
    maxMessagesRoom = results[0];
    fewMessagesRoom = results[1];
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTeardown_1.default.teardown(server);
}));
// No more object id checks past here
describe("POST /rooms/:roomId/messages", () => {
    let urlTrunk;
    let maxMessagesRoomAuth;
    let fewMessagesRoomAuth;
    let message;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const defaultRoom = fewMessagesRoom;
        const possibleMessage = defaultRoom.messages[0];
        if ('content' in possibleMessage
            && 'create_date' in possibleMessage
            && 'user' in possibleMessage) {
            message = possibleMessage;
        }
        urlTrunk = `/rooms/${defaultRoom._id}/messages`;
        const fewMessagesRoomUser = {
            username: fewMessagesRoom.users[0],
            roomId: fewMessagesRoom._id
        };
        fewMessagesRoomAuth = {
            user: fewMessagesRoomUser,
            token: (0, auth_1.generateAuthToken)(fewMessagesRoomUser)
        };
        const maxMessagesRoomUser = {
            username: maxMessagesRoom.users[0],
            roomId: maxMessagesRoom._id
        };
        maxMessagesRoomAuth = {
            user: maxMessagesRoomUser,
            token: (0, auth_1.generateAuthToken)(maxMessagesRoomUser)
        };
    }));
    test("Post in room at max messages", () => __awaiter(void 0, void 0, void 0, function* () {
        const url = `/rooms/${maxMessagesRoom._id}/messages`;
        const res = yield (0, supertest_1.default)(app)
            .post(url)
            .set("Authorization", `Bearer ${maxMessagesRoomAuth.token}`)
            .set("Content-Type", "multipart/form-data")
            .field("content", message.content)
            .expect(200);
        expect(res.body).toHaveProperty("message");
        const room = yield room_1.default
            .findById(maxMessagesRoom._id)
            .lean()
            .exec();
        if (room === null) {
            throw new Error("maxMessagesRoom not found in db");
        }
        // Total messages should be capped at max
        expect(room.messages.length).toBe(room_2.default.MESSAGES_LENGTH.max);
    }));
});
