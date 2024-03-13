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
const users_1 = __importDefault(require("../../../routes/users"));
const auth_1 = require("../../../utils/auth");
let server, app;
let maxUsersRoom;
let fewUsersRoom;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const setup = yield setupTeardown_1.default.appSetup(users_1.default, "/rooms/:roomId/users", (0, objectId_1.setObjectIdDocument)("params", "roomId", room_1.default));
    server = setup.server;
    app = setup.app;
    const results = yield Promise.all([
        room_1.default.findOne({
            $where: "this.users.length === this.max_user_count",
        })
            .lean()
            .exec(),
        room_1.default.findOne({
            $where: "this.users.length < this.max_user_count && this.users.length > 0",
        })
            .lean()
            .exec(),
    ]);
    if (results[0] === null || results[1] === null) {
        throw new Error("maxUsersRoom or fewUsersRoom is null");
    }
    maxUsersRoom = results[0];
    fewUsersRoom = results[1];
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTeardown_1.default.teardown(server);
}));
describe("POST /rooms/:roomId/users", () => {
    let urlTrunk;
    beforeAll(() => {
        urlTrunk = `/rooms/${fewUsersRoom._id}/users`;
    });
    describe("Invalid roomId", () => {
        const urlTrunk = (roomId) => `/rooms/${roomId}/users`;
        test("Non-existent roomId", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .post(urlTrunk("000011112222333344445555"))
                .expect("Content-Type", /json/)
                .expect(404);
        }));
        test("Invalid ObjectId", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .post(urlTrunk("test"))
                .expect("Content-Type", /json/)
                .expect(400);
        }));
    });
    describe("Invalid body params", () => {
        describe("user", () => {
            test("Invalid length", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield (0, supertest_1.default)(app)
                    .post(urlTrunk)
                    .set("Content-Type", "multipart/form-data")
                    .field("user", "")
                    .expect("Content-Type", /json/)
                    .expect(400);
                expect(res.body).toHaveProperty("errors");
            }));
        });
    });
    test("Room is full", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post(`/rooms/${maxUsersRoom._id}/users`)
            .set("Content-Type", "multipart/form-data")
            .field("user", "xxxxxx")
            .expect("Content-Type", /json/)
            .expect(403);
        expect(res.body).toHaveProperty("errors");
    }));
    test("User already exists in room", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post(urlTrunk)
            .set("Content-Type", "multipart/form-data")
            .field("user", fewUsersRoom.users[0])
            .expect("Content-Type", /json/)
            .expect(403);
        expect(res.body).toHaveProperty("errors");
    }));
});
// No more object id checks past here
describe("DELETE /rooms/:roomId/users/:userId", () => {
    let urlTrunk;
    let maxUsersRoomAuth;
    let fewUsersRoomAuth;
    beforeAll(() => {
        urlTrunk = `/rooms/${fewUsersRoom._id}/users`;
        const maxUsersRoomUser = {
            username: maxUsersRoom.users[0],
            roomId: maxUsersRoom._id
        };
        maxUsersRoomAuth = {
            user: maxUsersRoomUser,
            token: (0, auth_1.generateAuthToken)(maxUsersRoomUser)
        };
        const fewUsersRoomUser = {
            username: fewUsersRoom.users[0],
            roomId: fewUsersRoom._id
        };
        fewUsersRoomAuth = {
            user: fewUsersRoomUser,
            token: (0, auth_1.generateAuthToken)(fewUsersRoomUser)
        };
    });
    describe('Not authenticated', () => {
        test("No auth token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .delete(urlTrunk + "/test")
                .expect("Content-Type", /json/)
                .expect(401);
            expect(res.body).toHaveProperty("errors");
        }));
    });
    describe('User not in room', () => {
        test("Authenticated for a different room", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app)
                .delete(`${urlTrunk}/${fewUsersRoomAuth.user.username}`)
                .set("Authorization", `Bearer ${maxUsersRoomAuth.token}`)
                .expect("Content-Type", /json/)
                .expect(403);
            expect(res.body).toHaveProperty("errors");
        }));
    });
});
