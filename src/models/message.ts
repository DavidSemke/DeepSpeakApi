import mongoose, { Schema } from "mongoose"
import { MessageType } from "../types/model"

const MessageSchema = new Schema<MessageType>({
  content: { type: String, required: true },
  create_date: { type: Date, required: true },
  user: { type: String, required: true },
})

export default mongoose.model<MessageType>("Message", MessageSchema)
