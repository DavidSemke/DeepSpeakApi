const Room = require("../../models/room")
const Message = require("../../models/message")
const messageData = require("./documents/messageData")
const roomData = require("./documents/roomData")

const rooms = []
const messages = []

async function populate() {
  const messageDocs = messageData.getData()
  await createMessages(messageDocs)

  const roomDocs = roomData.getData(messages)
  await createRooms(roomDocs)
}

async function roomCreate(index, roomData) {
  const room = new Room(roomData)
  await room.save()
  rooms[index] = room
}

async function messageCreate(index, messageData) {
  const message = new Message(messageData)
  await message.save()
  messages[index] = message
}

async function createMessages(messageData) {
  await Promise.all(
    messageData.map((data, index) => {
      return messageCreate(index, data)
    }),
  )
}

async function createRooms(roomData) {
  await Promise.all(
    roomData.map((data, index) => {
      return roomCreate(index, data)
    }),
  )
}

module.exports = {
  populate,
}
