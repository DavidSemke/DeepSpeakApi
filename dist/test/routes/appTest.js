"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
function App(router, routerPath, routingMidArray = []) {
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
        const err = new Error('Resource not found');
        err.status = 404;
        console.log(req.url);
        next(err);
    });
    app.use(function (err, req, res, next) {
        const status = err.status || 500;
        let msg = 'Internal Server Error';
        if (status !== 500) {
            msg = err.message;
        }
        // if (status === 404) {
        //   console.log(req.url)
        // }
        const errors = [{ message: msg }];
        res.status(status).json({ errors });
    });
    return app;
}
exports.default = App;
