const asyncHandler = require("express-async-handler")
const Room = require('../models/room')


exports.getManyRooms = asyncHandler(async (req, res, next) => {
    // filter by topic, date
    // limit
    // offset (get different rooms when using limit)
})

exports.postRoom = (req, res, next) => {

}

exports.getRoom = (req, res, next) => {
    res.json({ message: req.documents.roomId })
}

exports.patchRoom = (req, res, next) => {

}

exports.deleteRoom = (req, res, next) => {
    
}