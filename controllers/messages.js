const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const createDOMPurify = require("dompurify")
const { JSDOM } = require("jsdom")
const Message = require('../models/message')
const queryParams = require('./validation/queryParams')
const messageBody = require('./validation/messageBody')
const manyQuery = require('./query/many')


exports.getManyMessages = [
    ...queryParams.messageSort,
    ...queryParams.pagination,
    manyQuery.findMany(Message)
]

exports.postMessage = [
    ...messageBody.message,

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req).array()

        if (errors.length) {
            res.status(400).json({ errors })
            return
        }

        const content = req.body['content']
        const author = req.body['author']

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const data = {
            content: DOMPurify.sanitize(content),
            create_date: Date.now(),
            author: DOMPurify.sanitize(author),
        }

        await Message.create(data)

        res.end()
    })
]

exports.getMessage = (req, res, next) => {
    res.json({ message: req.documents.messageId })
}