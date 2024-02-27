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
        
        const createDate = Date.now()
        const deleteDate = Date.now()
        // FOR TESTING - SET 1 MIN IN THE FUTURE
        deleteDate.setMinutes(deleteDate.getMinutes()+1)

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const data = {
            topic: DOMPurify.sanitize(topic),
            create_date: createDate,
            delete_date: deleteDate,
            max_user_count: DOMPurify.sanitize(maxUserCount),
            users: [],
            messages: []
        }

        await Room.create(data)

        res.end()
    })
]

exports.getRoom = (req, res, next) => {
    res.json({ message: req.documents.roomId })
}