import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { generateAuthToken } from "../utils/auth"
import { Request, Response, NextFunction } from "express"
import { user } from "./validation/userBody"
import Room from "../models/room"

export const postUser = [
  ...user,

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const window = new JSDOM("").window
    const DOMPurify = createDOMPurify(window)
    const user = DOMPurify.sanitize(req.body["user"])

    const room = req.documents.roomId

    if (room.users.length === room.max_user_count) {
      const err = new Error("Room cannot accept a new user as it is full")
      err.status = 403

      return next(err)
    }

    if (room.users.includes(user)) {
      const err = new Error("User already exists in room")
      err.status = 403

      return next(err)
    }

    if (room.deleted_users.includes(user)) {
      const err = new Error("User was deleted from room")
      err.status = 403

      return next(err)
    }

    // add user to room
    room.users.push(user)

    await Room.findOneAndUpdate({ _id: room._id }, { users: room.users })
      .lean()
      .exec()
    
    // generate jwt token
    const token = generateAuthToken(
      {
        username: user,
        roomId: room._id.toString()
      }
    )

    res.json(token)
  }),
]

export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params['userId']

    if (req.user.username !== userId) {
      const err = new Error('User can only delete self')
      err.status = 403

      return next(err)
    }

    const room = req.documents.roomId
    room.users = room.users.filter((user: string) => user !== userId)
    room.deleted_users.push(userId)

    await Room.findOneAndUpdate(
      { _id: room._id }, 
      { 
        users: room.users,
        deleted_users: room.deleted_users
      }
    )
      .lean()
      .exec()

    res.end()
  },
)

export default {
  postUser,
  deleteUser,
}
