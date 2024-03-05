import { HydratedDocument } from "mongoose"
import { MessageType, RoomType } from "../../types/model"
import Room from "../../models/room"
import Message from "../../models/message"
import messageData from "./documents/messageData"
import roomData from "./documents/roomData"

const rooms: HydratedDocument<RoomType>[] = []
const messages: HydratedDocument<MessageType>[] = []

async function populate() {
  const messageDocs = messageData.getData()
  await createMessages(messageDocs)

  const roomDocs = roomData.getData(messages)
  await createRooms(roomDocs)
}

async function roomCreate(index: number, roomData: RoomType) {
  const room = new Room(roomData)
  await room.save()
  rooms[index] = room
}

async function messageCreate(index: number, messageData: MessageType) {
  const message = new Message(messageData)
  await message.save()
  messages[index] = message
}

async function createMessages(messageData: MessageType[]) {
  await Promise.all(
    messageData.map((data, index) => {
      return messageCreate(index, data)
    }),
  )
}

async function createRooms(roomData: RoomType[]) {
  await Promise.all(
    roomData.map((data, index) => {
      return roomCreate(index, data)
    }),
  )
}

export default populate
