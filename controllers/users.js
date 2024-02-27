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
        const roomIsFull = room.users.length === room.max_user_count

        if (roomIsFull) {
            const err = new Error(
                'Room cannot accept a new user as it is full'
            )
            err.status = 403

            return next(err)
        }

        const userAlreadyExists = room.users.includes(user)

        if (userAlreadyExists) {
            const err = new Error(
                'User already exists in room'
            )
            err.status = 403

            return next(err)
        }

        room.users.push(user)

        await Room.findOneAndUpdate(
            { _id: room._id },
            { users: room.users}
        )

        res.end()
    })
]

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const userToRemove = DOMPurify.sanitize(req.params['userId'])
    const room = req.documents.roomId
    const userNotInRoom = !room.users.includes(userToRemove)

    if (userNotInRoom) {
        const err = new Error(
            'User not found'
        )
        err.status = 404

        return next(err)
    }

    room.users.filter(user => user !== userToRemove)

    await Room.findOneAndUpdate(
        { _id: room._id },
        { users: room.users}
    )

    res.end()
})