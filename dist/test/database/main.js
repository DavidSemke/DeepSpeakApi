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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const populateDb_1 = __importDefault(require("./populateDb"));
mongoose_1.default.set("strictQuery", false);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Debug: About to connect");
        yield mongoose_1.default.connect(process.env.MONGO_DB_CONNECT);
        console.log("Debug: Should be connected?");
        yield (0, populateDb_1.default)();
        console.log("Debug: Closing mongoose");
        mongoose_1.default.connection.close();
    });
}
main().catch((err) => console.log(err));
