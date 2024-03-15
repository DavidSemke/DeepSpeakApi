import { HydratedDocument } from "mongoose"
import { MessageType, RoomType } from "../../../types/model"
import consts from "../../../models/constants/room"

const inputData = [
  {
    topic: "Sad gerbil",
  },
  {
    topic: "Glad squirrel",
  },
  {
    topic: "Bad hurtle",
  },
  {
    topic: "Mad turtle",
  },
  {
    topic: "Fad purple",
  },
  {
    topic: "Lad circle",
  },
]

function getData(messages: HydratedDocument<MessageType>[]): RoomType[] {
  if (messages.length < consts.MESSAGES_LENGTH.max) {
    throw new Error("Not enough unique messages to meet max messages length")
  }

  const baseDate = new Date()
  const completeData = inputData.map((data, index) => {
    const createDate = new Date(baseDate.getTime())
    const deleteDate = new Date(baseDate.getTime())
    deleteDate.setHours(baseDate.getHours() + 24)

    // At least one message to a room (empty room case insignificant)
    const messageSlice = messages.slice(index % messages.length)

    const users: string[] = []
    for (const msg of messageSlice) {
      if (!users.includes(msg.user)) {
        users.push(msg.user)
      }
    }

    return {
      ...data,
      create_date: createDate,
      delete_date: deleteDate,
      max_user_count: Math.max(users.length + (index % 2), 2),
      users,
      deleted_users: ['deletedUser' + index],
      messages: messageSlice.map((msg) => msg._id),
    }
  })

  return completeData
}

export default {
  getData,
}
