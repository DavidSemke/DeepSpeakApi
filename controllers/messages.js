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

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const content = DOMPurify.sanitize(req.body['content'])
        const user = DOMPurify.sanitize(req.body['user'])

        const room = req.documents.roomId
        const userNotInRoom = !room.users.includes(user)

        if (userNotInRoom) {
            const err = new Error(
                'User does not exist in room'
            )
            err.status = 403

            return next(err)
        }

        const data = {
            content,
            user,
            create_date: Date.now(),
        }

        await Message.create(data)

        res.end()
    })
]

exports.getMessage = (req, res, next) => {
    res.json({ message: req.documents.messageId })
}