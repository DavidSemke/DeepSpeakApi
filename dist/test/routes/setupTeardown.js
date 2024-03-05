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
const populateDb_1 = __importDefault(require("../database/populateDb"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoConfigTest_1 = __importDefault(require("./mongoConfigTest"));
const appTest_1 = __importDefault(require("./appTest"));
function appSetup(router, routerPath, routingMidArray = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const server = yield serverSetup();
        const app = appTest_1.default.create(router, routerPath, routingMidArray);
        return { server, app };
    });
}
function serverSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = yield mongoConfigTest_1.default.startServer();
        yield (0, populateDb_1.default)();
        return server;
    });
}
function teardown(server) {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
        yield mongoConfigTest_1.default.stopServer(server);
    });
}
exports.default = {
    appSetup,
    teardown,
};
