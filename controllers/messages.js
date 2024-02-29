const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const createDOMPurify = require("dompurify")
const { JSDOM } = require("jsdom")
const Message = require('../models/message')
const Room = require('../models/room')
const roomConsts = require('../models/constants/room')
const queryParams = require('./validation/queryParams')
const messageBody = require('./validation/messageBody')
const manyQuery = require('./query/many')


exports.getManyMessages = [
    ...queryParams.messageSort,
    ...queryParams.pagination,
    (req, res, next) => {
        const room = req.documents.roomId
        manyQuery.findMany(
            Message,
            { _id: { $in: room.messages} }
        )(req, res, next)
    }
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

        if (!room.users.includes(user)) {
            const err = new Error(
                'User does not exist in room'
            )
            err.status = 403

            return next(err)
        }

        // Remove oldest message if at message capacity
        if (room.messages.length === roomConsts.MESSAGES_LENGTH.max) {
            room.messages.shift()
        }

        const data = {
            content,
            user,
            create_date: Date.now(),
        }

        const msg = await Message.create(data)
        room.messages.push(msg._id)
        

        await Room
            .findOneAndUpdate(
                { _id: room._id },
                { messages: room.messages }
            )
            .lean()
            .exec()

        res.end()
    })
]

exports.getMessage = (req, res, next) => {
    const room = req.documents.roomId
    const message = req.documents.messageId
    const roomMsgStrIds = room.messages.map(msg => msg.toString())
    
    if (!roomMsgStrIds.includes(message._id.toString())) {
        const err = new Error('Message does not belong to room')
        err.status = 403

        return next(err)
    }

    res.json({ message })
}