import mongoose, { Schema, Types } from "mongoose"
import { RoomType } from "../types/model"

const RoomSchema = new Schema<RoomType>({
  topic: { type: String, required: true },
  create_date: { type: Date, required: true },
  delete_date: { type: Date, required: true },
  max_user_count: { type: Number, required: true },
  users: { type: [String], required: true },
  messages: {
    type: [
      {
        type: Types.ObjectId,
        ref: "Message",
      },
    ],
    required: true,
  },
})

export default mongoose.model<RoomType>("Room", RoomSchema)
