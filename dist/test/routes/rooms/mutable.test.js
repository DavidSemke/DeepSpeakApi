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
let server, app;
let room;
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    const setup = yield setupTeardown_1.default.appSetup(rooms_1.default, "/rooms");
    server = setup.server;
    app = setup.app;
    room = (yield room_1.default.findOne().lean().exec());
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield setupTeardown_1.default.teardown(server);
}));
describe("POST /rooms", () => {
    const urlTrunk = "/rooms";
    // Requirement: All test room topics are unique
    test("All inputs", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app)
            .post(urlTrunk)
            .set("Content-Type", "multipart/form-data")
            .field("topic", room.topic)
            .field("max-user-count", room.max_user_count)
            .expect(200);
        const rooms = yield room_1.default.find({ topic: room.topic }).lean().exec();
        expect(rooms.length).toBe(2);
    }));
});
