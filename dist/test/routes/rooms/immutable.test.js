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
const setupTeardown_1 = __importDefault(require("../setupTeardown"));
const rooms_1 = __importDefault(require("../../../routes/rooms"));
const room_2 = __importDefault(require("../../../models/constants/room"));
let server, app;
let room;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const setup = yield setupTeardown_1.default.appSetup(rooms_1.default, "/rooms");
    server = setup.server;
    app = setup.app;
    room = (yield room_1.default.findOne().lean().exec());
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTeardown_1.default.teardown(server);
}));
describe("GET /rooms", () => {
    const urlTrunk = "/rooms";
    describe("Invalid query params", () => {
        describe("Order-by", () => {
            test("Does not ref Room schema prop", () => __awaiter(void 0, void 0, void 0, function* () {
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
    // Requirement: rooms must have unique topic values
    test("All params", () => __awaiter(void 0, void 0, void 0, function* () {
        const limit = 3;
        const url = `${urlTrunk}?order-by=topic&order=desc&limit=${limit}`;
        const resNoOffset = yield (0, supertest_1.default)(app)
            .get(url)
            .expect("Content-Type", /json/)
            .expect(200);
        const rooms = resNoOffset.body["room_collection"];
        expect(rooms.length).toBe(limit);
        // Check if order=desc produced correct results
        for (let i = 0; i < rooms.length - 1; i++) {
            const room = rooms[i];
            const nextRoom = rooms[i + 1];
            expect(room.topic >= nextRoom.topic);
        }
        // Make another request with offset; returned rooms should all be new
        const offset = limit;
        const resOffset = yield (0, supertest_1.default)(app)
            .get(`${url}&offset=${offset}`)
            .expect("Content-Type", /json/)
            .expect(200);
        const newRooms = resOffset.body["room_collection"];
        for (const newRoom of newRooms) {
            for (const oldRoom of rooms) {
                expect(oldRoom).not.toEqual(newRoom);
            }
        }
    }));
});
describe("POST /rooms", () => {
    const urlTrunk = "/rooms";
    describe("Invalid body params", () => {
        describe("topic", () => {
            test("Invalid length", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .post(urlTrunk)
                    .set("Content-Type", "multipart/form-data")
                    .field("topic", "")
                    .field("max-user-count", room.max_user_count)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
        describe("max-user-count", () => {
            test("Not numeric", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .post(urlTrunk)
                    .set("Content-Type", "multipart/form-data")
                    .field("topic", room.topic)
                    .field("max-user-count", "test")
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
            test("Invalid length", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .post(urlTrunk)
                    .set("Content-Type", "multipart/form-data")
                    .field("topic", room.topic)
                    .field("max-user-count", room_2.default.MAX_USER_COUNT_LENGTH.min - 1)
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
    });
});
describe("GET /rooms/:roomId", () => {
    const urlTrunk = "/rooms";
    describe("Invalid roomId", () => {
        test("Non-existent roomId", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .get(`${urlTrunk}/000011112222333344445555`)
                .expect("Content-Type", /json/)
                .expect(404);
        }));
        test("Invalid ObjectId", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .get(`${urlTrunk}/test`)
                .expect("Content-Type", /json/)
                .expect(400);
        }));
    });
    test("GET", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .get(`${urlTrunk}/${room._id}`)
            .expect("Content-Type", /json/)
            .expect(200);
        expect(res.body).toHaveProperty("room");
    }));
});
