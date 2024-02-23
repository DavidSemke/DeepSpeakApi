const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const createDOMPurify = require("dompurify")
const { JSDOM } = require("jsdom")
const Room = require('../models/room')
const queryParams = require('./validation/queryParams')
const roomBody = require('./validation/roomBody')
const manyQuery = require('./query/many')


exports.getManyRooms = [
    ...queryParams.roomSort,
    ...queryParams.pagination,
    manyQuery.findMany(Room)
]

exports.postRoom = [
    ...roomBody.postRoom,

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req).array()

        if (errors.length) {
            res.status(400).json({ errors })
            return
        }

        const topic = req.body['topic']
        const maxUserCount = req.body['max-user-count']
        
        const deleteDate = Date.now()
        deleteDate.setMinutes(d.getMinutes()+1) // FOR TESTING - SET 1 MIN IN THE FUTURE

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const data = {
            topic: DOMPurify.sanitize(topic),
            create_date: Date.now(),
            delete_date: deleteDate,
            max_user_count: DOMPurify.sanitize(maxUserCount),
            user_count: 0,
            messages: []
        }

        await Room.create(data)

        res.end()
    })
]

exports.getRoom = (req, res, next) => {
    res.json({ message: req.documents.roomId })
}

exports.patchRoom = [
    ...roomBody.patchRoom,

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req).array()

        if (errors.length) {
            res.status(400).json({ errors })
            return
        }

        const room = req.documents.roomId
        const userCount = req.body['user-count']

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const data = {
            user_count: DOMPurify.sanitize(userCount),
        }

        await Room.findOneAndUpdate(
            { _id: room._id },
            data
        ).exec()

        res.end()
    })
]

exports.deleteRoom = asyncHandler(async (req, res, next) => {
    await Room.findOneAndDelete(
        { _id: req.documents.roomId._id }
    ).exec()

    res.end()
})