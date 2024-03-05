import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { Request, Response, NextFunction } from "express"
import Room from "../models/room"
import { roomSort, pagination } from "./validation/queryParams"
import { room } from "./validation/roomBody"
import manyQuery from "./query/many"

export const getManyRooms = [
  ...roomSort,
  ...pagination,
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

    const topic = req.body["topic"]
    const maxUserCount = req.body["max-user-count"]

    const createDate = new Date()
    const deleteDate = new Date(createDate.getTime())
    // Set time to live to 24 hours
    deleteDate.setHours(deleteDate.getHours() + 24)

    const window = new JSDOM("").window
    const DOMPurify = createDOMPurify(window)
    const data = {
      topic: DOMPurify.sanitize(topic),
      create_date: createDate,
      delete_date: deleteDate,
      max_user_count: DOMPurify.sanitize(maxUserCount),
      users: [],
      messages: [],
    }

    await Room.create(data)

    res.end()
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
