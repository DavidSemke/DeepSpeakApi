import { Types } from "mongoose"

type MessageType = {
  content: string
  create_date: Date
  user: string
}

type RoomType = {
  topic: string
  create_date: Date
  delete_date: Date
  max_user_count: number
  users: string[]
  messages: Types.ObjectId[]
}

export { MessageType, RoomType }
