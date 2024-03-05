"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({
    limits: {
        parts: 20,
        fileSize: 1000000, // limit image size to 1MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetypes = /image\/(jpeg|png|webp|gif)/;
        const validFileType = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const validMimeType = mimetypes.test(file.mimetype);
        if (validFileType && validMimeType) {
            req.fileTypeError = false;
            return cb(null, true);
        }
        else {
            req.fileTypeError = true;
            return cb(null, false);
        }
    },
});
exports.upload = upload;
function handleMulterError(err, req, res, next) {
    if (!err) {
        return next();
    }
    if (err instanceof multer_1.default.MulterError) {
        req.fileLimitError = err;
        return next();
    }
    next(err);
}
exports.handleMulterError = handleMulterError;
