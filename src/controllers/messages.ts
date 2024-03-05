import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { Request, Response, NextFunction } from "express"
import Message from "../models/message"
import Room from "../models/room"
import roomConsts from "../models/constants/room"
import { messageSort, pagination } from "./validation/queryParams"
import { message } from "./validation/messageBody"
import manyQuery from "./query/many"
import { Types } from "mongoose"

export const getManyMessages = [
  ...messageSort,
  ...pagination,
  (req: Request, res: Response, next: NextFunction) => {
    const room = req.documents.roomId
    manyQuery.findMany(Message, { _id: { $in: room.messages } })(req, res, next)
  },
]

export const postMessage = [
  ...message,

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const window = new JSDOM("").window
    const DOMPurify = createDOMPurify(window)
    const content = DOMPurify.sanitize(req.body["content"])
    const user = DOMPurify.sanitize(req.body["user"])

    const room = req.documents.roomId

    if (!room.users.includes(user)) {
      const err = new Error("User does not exist in room")
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

    await Room.findOneAndUpdate({ _id: room._id }, { messages: room.messages })
      .lean()
      .exec()

    res.end()
  }),
]

export function getMessage(req: Request, res: Response, next: NextFunction) {
  const room = req.documents.roomId
  const message = req.documents.messageId
  const roomMsgStrIds = room.messages.map((msg: Types.ObjectId) =>
    msg.toString(),
  )

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
