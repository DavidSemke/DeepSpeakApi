import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { Request, Response, NextFunction } from "express"
import Message from "../models/message"
import Room from "../models/room"
import roomConsts from "../models/constants/room"
import manyQuery from "./query/many"
import { Types } from "mongoose"

export const getManyMessages = (
  req: Request, res: Response, next: NextFunction
) => {
  const room = req.documents.roomId
  manyQuery.findMany(
    Message, 
    { _id: { $in: room.messages } }
  )(req, res, next)
}


export const postMessage = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const window = new JSDOM("").window
    const DOMPurify = createDOMPurify(window)
    const content = DOMPurify.sanitize(req.body["content"])

    const room = req.documents.roomId

    // Remove oldest message if at message capacity
    if (room.messages.length === roomConsts.MESSAGES_LENGTH.max) {
      room.messages.shift()
    }

    const data = {
      content,
      user: req.user.username,
      create_date: Date.now(),
    }

    const message = await Message.create(data)
    room.messages.push(message._id)

    await Room.findOneAndUpdate({ _id: room._id }, { messages: room.messages })
      .lean()
      .exec()

    res.json({ message: message.toObject() })
})


export function getMessage(req: Request, res: Response, next: NextFunction) {
  const room = req.documents.roomId
  const message = req.documents.messageId
  const roomMsgStrIds = room.messages
    .map((msg: Types.ObjectId) => msg.toString())

  if (!roomMsgStrIds.includes(message._id.toString())) {
    const err = new Error("Message does not belong to room")
    err.status = 403

    return next(err)
  }

  res.json({ message })
}

export default {
  getManyMessages,
  postMessage,
  getMessage,
}
