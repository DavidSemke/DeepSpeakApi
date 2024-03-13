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
const message_1 = __importDefault(require("../../../models/message"));
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
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
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
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTeardown_1.default.teardown(server);
}));
describe("GET /rooms/:roomId/messages", () => {
    let urlTrunk;
    beforeAll(() => {
        urlTrunk = `/rooms/${fewMessagesRoom._id}/messages`;
    });
    describe("Invalid roomId", () => {
        const urlTrunk = (roomId) => `/rooms/${roomId}/messages`;
        test("Non-existent roomId", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .get(urlTrunk("000011112222333344445555"))
                .expect("Content-Type", /json/)
                .expect(404);
            expect(res.body).toHaveProperty("errors");
        }));
        test("Invalid ObjectId", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .get(urlTrunk("test"))
                .expect("Content-Type", /json/)
                .expect(400);
            expect(res.body).toHaveProperty("errors");
        }));
    });
    describe("Invalid query params", () => {
        describe("Order-by", () => {
            test("Does not ref Message schema prop", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .get(`${urlTrunk}?order-by=`)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
        describe("Order", () => {
            test("Not in ['asc', 'desc']", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .get(`${urlTrunk}?order=test`)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
            test("Exists without order-by", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .get(`${urlTrunk}?order=asc`)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
        describe("Limit", () => {
            test("Includes non-digits", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .get(`${urlTrunk}?limit=-1`)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
        describe("Offset", () => {
            test("Includes non-digits", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .get(`${urlTrunk}?offset=-1`)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
    });
    // Requirement: messages must have unique content values
    test("All params", () => __awaiter(void 0, void 0, void 0, function* () {
        const limit = 3;
        const url = `${urlTrunk}?order-by=content&order=desc&limit=${limit}`;
        const resNoOffset = yield (0, supertest_1.default)(app)
            .get(url)
            .expect("Content-Type", /json/)
            .expect(200);
        const messages = resNoOffset.body["message_collection"];
        expect(messages.length).toBe(limit);
        // Check if messages belong to appropriate room
        const roomMsgStrIds = fewMessagesRoom.messages.map((msg) => msg.toString());
        for (const msg of messages) {
            expect(roomMsgStrIds.includes(msg._id.toString())).toBe(true);
        }
        // Check if order=desc produced correct results
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            const nextMsg = messages[i + 1];
            expect(msg.content >= nextMsg.content);
        }
        // Make another request with offset; returned messages should all be new
        const offset = limit;
        const resOffset = yield (0, supertest_1.default)(app)
            .get(`${url}&offset=${offset}`)
            .expect("Content-Type", /json/)
            .expect(200);
        const newMessages = resOffset.body["message_collection"];
        for (const newMsg of newMessages) {
            for (const oldMsg of messages) {
                expect(oldMsg).not.toEqual(newMsg);
            }
        }
    }));
});
// No more object id checks past here
describe("POST /rooms/:roomId/messages", () => {
    let urlTrunk;
    let maxMessagesToken;
    let fewMessagesToken;
    let message;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const defaultRoom = fewMessagesRoom;
        const possibleMessage = defaultRoom.messages[0];
        if ('content' in possibleMessage
            && 'create_date' in possibleMessage
            && 'user' in possibleMessage) {
            message = possibleMessage;
        }
        urlTrunk = `/rooms/${defaultRoom._id}/messages`;
        fewMessagesToken = (0, auth_1.generateAuthToken)({
            username: fewMessagesRoom.users[0],
            roomId: fewMessagesRoom._id
        });
        maxMessagesToken = (0, auth_1.generateAuthToken)({
            username: maxMessagesRoom.users[0],
            roomId: maxMessagesRoom._id
        });
    }));
    describe("Invalid body params", () => {
        describe("content", () => {
            test("Invalid length", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .post(urlTrunk)
                    .set("Authorization", `Bearer ${fewMessagesToken}`)
                    .set("Content-Type", "multipart/form-data")
                    .field("content", "")
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
    });
    describe('User in room', () => {
        test("Not authorized", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .post(urlTrunk)
                .set("Content-Type", "multipart/form-data")
                .field("content", message.content)
                .expect("Content-Type", /json/)
                .expect(401);
            expect(res.body).toHaveProperty("errors");
        }));
        test("At max messages", () => __awaiter(void 0, void 0, void 0, function* () {
            const url = `/rooms/${maxMessagesRoom._id}/messages`;
            yield (0, supertest_1.default)(app)
                .post(url)
                .set("Authorization", `Bearer ${maxMessagesToken}`)
                .set("Content-Type", "multipart/form-data")
                .field("content", message.content)
                .expect(200);
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
    // Requirement: maxMessagesRoom has no user equal to a user in fewMessagesRoom
    describe('User not in room', () => {
        test("Authorized", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .post(urlTrunk)
                .set("Authorization", `Bearer ${maxMessagesToken}`)
                .set("Content-Type", "multipart/form-data")
                .field("content", message.content)
                .expect("Content-Type", /json/)
                .expect(403);
            expect(res.body).toHaveProperty("errors");
        }));
    });
});
describe("GET /rooms/:roomId/messages/:messageId", () => {
    let roomMessage;
    let nonRoomMessage;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        roomMessage = (yield message_1.default.findOne({
            _id: { $in: fewMessagesRoom.messages },
        })
            .lean()
            .exec());
        nonRoomMessage = (yield message_1.default.findOne({
            _id: { $nin: fewMessagesRoom.messages },
        })
            .lean()
            .exec());
    }));
    test("Message does not belong to room", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .get(`/rooms/${fewMessagesRoom._id}/messages/${nonRoomMessage._id}`)
            .expect("Content-Type", /json/)
            .expect(403);
        expect(res.body).toHaveProperty("errors");
    }));
    test("Message belongs to room", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .get(`/rooms/${fewMessagesRoom._id}/messages/${roomMessage._id}`)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(res.body).toHaveProperty("message");
    }));
});
