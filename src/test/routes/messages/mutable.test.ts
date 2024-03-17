import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType, MessageType, UserType } from "../../../types/model"
import Room from "../../../models/room"
import { setObjectIdDocument } from "../../../routes/utils/objectId"
import setupTeardown from "../setupTeardown"
import messagesRouter from "../../../routes/messages"
import roomConsts from "../../../models/constants/room"
import { generateAuthToken } from "../../../utils/auth"

let server: MongoMemoryServer, app: Application
// fewMessagesRoom is default room
// maxMessagesRoom is only used when max messages required
let maxMessagesRoom: LeanDocument<RoomType>
let fewMessagesRoom: LeanDocument<RoomType>

beforeEach(async () => {
  const setup = await setupTeardown.appSetup(
    messagesRouter,
    "/rooms/:roomId/messages",
    setObjectIdDocument("params", "roomId", Room),
  )
  server = setup.server
  app = setup.app

  const results = await Promise.all([
    Room.findOne({
      messages: { $size: roomConsts.MESSAGES_LENGTH.max },
    })
      .populate('messages')
      .lean()
      .exec(),
    Room.findOne({
      $where: `this.messages.length < ${roomConsts.MESSAGES_LENGTH.max}`,
    })
      .populate('messages')
      .lean()
      .exec(),
  ])

  maxMessagesRoom = results[0] as LeanDocument<RoomType>
  fewMessagesRoom = results[1] as LeanDocument<RoomType>
})

afterEach(async () => {
  await setupTeardown.teardown(server)
})

// No more object id checks past here
describe("POST /rooms/:roomId/messages", () => {
    type Auth = {
      user: UserType,
      token: string
    }
  
    let urlTrunk: string
    let maxMessagesRoomAuth: Auth
    let fewMessagesRoomAuth: Auth
    let message: MessageType
  
    beforeEach(async () => {
      const defaultRoom = fewMessagesRoom
      const possibleMessage = defaultRoom.messages[0]
  
      if (
        'content' in possibleMessage
        && 'create_date' in possibleMessage
        && 'user' in possibleMessage
      ) {
        message = possibleMessage as MessageType
      }
  
      urlTrunk = `/rooms/${defaultRoom._id}/messages`
      const fewMessagesRoomUser = {
        username: fewMessagesRoom.users[0],
        roomId: fewMessagesRoom._id
      }
      fewMessagesRoomAuth = {
        user: fewMessagesRoomUser,
        token: generateAuthToken(fewMessagesRoomUser)
      }
      const maxMessagesRoomUser = {
        username: maxMessagesRoom.users[0],
        roomId: maxMessagesRoom._id
      }
      maxMessagesRoomAuth = {
        user: maxMessagesRoomUser,
        token: generateAuthToken(maxMessagesRoomUser)
      }
    })
  
    test("Post in room at max messages", async () => {
      const url = `/rooms/${maxMessagesRoom._id}/messages`
      
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${maxMessagesRoomAuth.token}`)
        .set("Content-Type", "multipart/form-data")
        .field("content", message.content)
        .expect(200)

      expect(res.body).toHaveProperty("message")
  
      const room = await Room
        .findById(maxMessagesRoom._id)
        .lean()
        .exec()
  
      if (room === null) {
        throw new Error("maxMessagesRoom not found in db")
      }
  
      // Total messages should be capped at max
      expect(room.messages.length).toBe(roomConsts.MESSAGES_LENGTH.max)
    })
  })