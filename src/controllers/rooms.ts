import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { Request, Response, NextFunction } from "express"
import Room from "../models/room"
import { roomSort, pagination, roomPopulation } from "./validation/queryParams"
import { room } from "./validation/roomBody"
import manyQuery from "./query/many"

export const getManyRooms = [
  ...roomSort,
  ...pagination,
  ...roomPopulation,
  manyQuery.findMany(Room),
]

export const postRoom = [
  ...room,

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const window = new JSDOM("").window
    const DOMPurify = createDOMPurify(window)
    const topic = DOMPurify.sanitize(req.body["topic"])
    const maxUserCount = DOMPurify.sanitize(req.body["max-user-count"])

    const createDate = new Date()
    const deleteDate = new Date(createDate.getTime())
    // Set time to live to 24 hours
    deleteDate.setHours(deleteDate.getHours() + 24)

    const data = {
      topic,
      create_date: createDate,
      delete_date: deleteDate,
      max_user_count: Number(maxUserCount),
      users: [],
      messages: [],
    }

    const room = await Room.create(data)

    res.json({ room: room.toObject() })
  }),
]

export function getRoom(req: Request, res: Response, next: NextFunction) {
  res.json({ room: req.documents.roomId })
}

export default {
  getManyRooms,
  postRoom,
  getRoom,
}
