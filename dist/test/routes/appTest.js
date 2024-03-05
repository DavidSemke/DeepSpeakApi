"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_errors_1 = __importDefault(require("http-errors"));
function create(router, routerPath, routingMidArray = []) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: false }));
    /* Route Setup */
    app.use((req, res, next) => {
        req.documents = {};
        next();
    });
    app.use(routerPath, routingMidArray, router);
    /* Error Handling */
    app.use(function (req, res, next) {
        next((0, http_errors_1.default)(404));
    });
    app.use(function (err, req, res, next) {
        const errors = [{ message: err.message }];
        res.status(err.status || 500).json({ errors });
    });
    return app;
}
exports.default = {
    create,
};
