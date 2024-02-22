const asyncHandler = require("express-async-handler")
const Message = require('../models/message')


exports.getManyMessages = asyncHandler(async (req, res, next) => {
    // filter by date, author name, create date
    // limit
    // offset (get different messages when using limit)
})

exports.postMessage = (req, res, next) => {

}

exports.getMessage = (req, res, next) => {
    res.json({ message: req.documents.messageId })
}