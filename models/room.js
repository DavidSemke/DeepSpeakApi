const mongoose = require("mongoose")
const Schema = mongoose.Schema
const consts = require('./constants/room')


const RoomSchema = new Schema({
  topic: { type: String, required: true },
  create_date: { type: Date, required: true },
  delete_date: { type: Date, required: true },
  max_user_count: { type: Number, required: true },
  users: { type: [String] },
  messages: { 
    type: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
    validate: [
        (val) => val.length <= consts.MESSAGES_LENGTH.max,
        `{PATH} exceeds the length limit of ${consts.MESSAGES_LENGTH.max}.`
    ]
  },
})


module.exports = mongoose.model("Room", RoomSchema)