import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType, MessageType, UserType } from "../../../types/model"
import Message from "../../../models/message"
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

beforeAll(async () => {
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

afterAll(async () => {
  await setupTeardown.teardown(server)
})

describe("GET /rooms/:roomId/messages", () => {
  let urlTrunk: string

  beforeAll(() => {
    urlTrunk = `/rooms/${fewMessagesRoom._id}/messages`
  })

  describe("Invalid roomId", () => {
    const urlTrunk = (roomId: string) => `/rooms/${roomId}/messages`

    test("Non-existent roomId", async () => {
      const res = await request(app)
        .get(urlTrunk("000011112222333344445555"))
        .expect("Content-Type", /json/)
        .expect(404)

      expect(res.body).toHaveProperty("errors")
    })

    test("Invalid ObjectId", async () => {
      const res = await request(app)
        .get(urlTrunk("test"))
        .expect("Content-Type", /json/)
        .expect(400)

      expect(res.body).toHaveProperty("errors")
    })
  })

  describe("Invalid query params", () => {
    describe("Order-by", () => {
      test("Does not ref Message schema prop", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order-by=`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("Order", () => {
      test("Not in ['asc', 'desc']", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order=test`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })

      test("Exists without order-by", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order=asc`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("Limit", () => {
      test("Includes non-digits", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?limit=-1`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("Offset", () => {
      test("Includes non-digits", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?offset=-1`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("Ids", () => {
      test("Contains invalid object ids", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?ids=a,b,c`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })

      test("Contains object ids not from room messages", async () => {
        const messageIds = [
          fewMessagesRoom.messages[0]._id,
          maxMessagesRoom.messages[0]._id
        ]
        const res = await request(app)
          .get(`${urlTrunk}?ids=${messageIds.join(',')}`)
          .expect("Content-Type", /json/)
          .expect(200)
        
        const messages = res.body["message_collection"]
        // One message id belongs to room, the other does not
        expect(messages.length).toBe(1)
        expect(messages[0]._id.toString())
          .toBe(fewMessagesRoom.messages[0]._id.toString())
      })
    })
  })

  // Requirement: messages must have unique content values
  test("All params except ids", async () => {
    const limit = 3
    const url = `${urlTrunk}?order-by=content&order=desc&limit=${limit}`
    const resNoOffset = await request(app)
      .get(url)
      .expect("Content-Type", /json/)
      .expect(200)

    const messages = resNoOffset.body["message_collection"]
    expect(messages.length).toBe(limit)

    // Check if messages belong to appropriate room
    const roomMsgStrIds = fewMessagesRoom.messages.map((msg) => msg._id.toString())

    for (const msg of messages) {
      expect(roomMsgStrIds.includes(msg._id.toString())).toBe(true)
    }

    // Check if order=desc produced correct results
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i]
      const nextMsg = messages[i + 1]
      expect(msg.content >= nextMsg.content)
    }

    // Make another request with offset; returned messages should all be new
    const offset = limit
    const resOffset = await request(app)
      .get(`${url}&offset=${offset}`)
      .expect("Content-Type", /json/)
      .expect(200)

    const newMessages = resOffset.body["message_collection"]

    for (const newMsg of newMessages) {
      for (const oldMsg of messages) {
        expect(oldMsg).not.toEqual(newMsg)
      }
    }
  })

  test('Ids param', async () => {
    const urlTrunk = `/rooms/${maxMessagesRoom._id}/messages`
    // Have only one id in ids; all other ids should be filtered
    const ids = [maxMessagesRoom.messages[0]._id]
    const res = await request(app)
      .get(`${urlTrunk}?ids=${ids.join(',')}`)
      .expect("Content-Type", /json/)
      .expect(200)

    const messages = res.body["message_collection"]
    expect(messages.length).toBe(1)
    expect(messages[0]._id.toString()).toBe(ids[0].toString())
  })
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

  beforeAll(async () => {
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

  describe("Invalid body params", () => {
    describe("content", () => {
      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Authorization", `Bearer ${fewMessagesRoomAuth.token}`)
          .set("Content-Type", "multipart/form-data")
          .field("content", "")
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })
  })

  describe('Not authenticated', () => {
    test("No auth token", async () => {
      const res = await request(app)
        .post(urlTrunk)
        .set("Content-Type", "multipart/form-data")
        .field("content", message.content)
        .expect("Content-Type", /json/)
        .expect(401)
  
      expect(res.body).toHaveProperty("errors")
    })
  })

  describe('User not in room', () => {
    test("Authenticated for a different room", async () => {
      const res = await request(app)
        .post(urlTrunk)
        .set("Authorization", `Bearer ${maxMessagesRoomAuth.token}`)
        .set("Content-Type", "multipart/form-data")
        .field("content", message.content)
        .expect("Content-Type", /json/)
        .expect(403)
  
      expect(res.body).toHaveProperty("errors")
    })

    test("User deleted", async () => {
      const user = {
        username: fewMessagesRoom.deleted_users[0],
        roomId: fewMessagesRoom._id
      }
      const auth = {
        user,
        token: generateAuthToken(user)
      }
      
      const res = await request(app)
        .post(urlTrunk)
        .set("Authorization", `Bearer ${auth.token}`)
        .set("Content-Type", "multipart/form-data")
        .field("content", message.content)
        .expect("Content-Type", /json/)
        .expect(403)
  
      expect(res.body).toHaveProperty("errors")
    })
  })
})

describe("GET /rooms/:roomId/messages/:messageId", () => {
  let roomMessage: LeanDocument<MessageType>
  let nonRoomMessage: LeanDocument<MessageType>

  beforeAll(async () => {
    roomMessage = (await Message.findOne({
      _id: { $in: fewMessagesRoom.messages },
    })
      .lean()
      .exec()) as LeanDocument<MessageType>
    nonRoomMessage = (await Message.findOne({
      _id: { $nin: fewMessagesRoom.messages },
    })
      .lean()
      .exec()) as LeanDocument<MessageType>
  })

  test("Message does not belong to room", async () => {
    const res = await request(app)
      .get(`/rooms/${fewMessagesRoom._id}/messages/${nonRoomMessage._id}`)
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("Message belongs to room", async () => {
    const res = await request(app)
      .get(`/rooms/${fewMessagesRoom._id}/messages/${roomMessage._id}`)
      .expect("Content-Type", /json/)
      .expect(200)

    expect(res.body).toHaveProperty("message")
  })
})
