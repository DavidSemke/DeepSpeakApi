const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const createDOMPurify = require("dompurify")
const { JSDOM } = require("jsdom")
const userBody = require('./validation/userBody')
const Room = require('../models/room')


exports.postUser = [
    ...userBody.user,

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req).array()

        if (errors.length) {
            res.status(400).json({ errors })
            return
        }

        const window = new JSDOM("").window
        const DOMPurify = createDOMPurify(window)
        const user = DOMPurify.sanitize(req.body['user'])

        const room = req.documents.roomId

        if (room.users.length === room.max_user_count) {
            const err = new Error(
                'Room cannot accept a new user as it is full'
            )
            err.status = 403

            return next(err)
        }

        if (room.users.includes(user)) {
            const err = new Error(
                'User already exists in room'
            )
            err.status = 403

            return next(err)
        }

        room.users.push(user)

        await Room
            .findOneAndUpdate(
                { _id: room._id },
                { users: room.users}
            )
            .lean()
            .exec()

        res.end()
    })
]

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const userToRemove = req.params['userId']
    const room = req.documents.roomId

    if (!room.users.includes(userToRemove)) {
        const err = new Error('User not found')
        err.status = 404

        return next(err)
    }

    room.users = room.users.filter(user => user !== userToRemove)

    await Room
        .findOneAndUpdate(
            { _id: room._id },
            { users: room.users}
        )
        .lean()
        .exec()

    res.end()
})