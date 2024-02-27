const mongoose = require("mongoose")
const Schema = mongoose.Schema

const MessageSchema = new Schema({
  content: { type: String, required: true },
  create_date: { type: Date, required: true },
  user: { type: String, required: true }
})

module.exports = mongoose.model("Message", MessageSchema)