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
  deleted_users: string[]
  messages: Types.ObjectId[]
}

// Model does not exist for user
// This is because users are anonymous
type UserType = {
  username: string,
  roomId: Types.ObjectId
}

export { MessageType, RoomType, UserType }
