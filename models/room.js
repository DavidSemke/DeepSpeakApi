const mongoose = require("mongoose")
const Schema = mongoose.Schema

const RoomSchema = new Schema({
  topic: { type: String, required: true },
  create_date: { type: Date, required: true },
  delete_date: { type: Date, required: true },
  max_user_count: { type: Number, required: true },
  users: { type: [String] },
  messages: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
})

module.exports = mongoose.model("Room", RoomSchema)
