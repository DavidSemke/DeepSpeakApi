import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType, MessageType } from "../../../types/model"
import Message from "../../../models/message"
import Room from "../../../models/room"
import { setObjectIdDocument } from "../../../routes/utils/objectId"
import setupTeardown from "../setupTeardown"
import messagesRouter from "../../../routes/messages"
import roomConsts from "../../../models/constants/room"

let server: MongoMemoryServer, app: Application
// fewMessagesRoom is default room
// maxMessagesRoom is only used when max messages required
let message: LeanDocument<MessageType>
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
    Message.findOne().lean().exec(),
    Room.findOne({
      messages: { $size: roomConsts.MESSAGES_LENGTH.max },
    })
      .lean()
      .exec(),
    Room.findOne({
      $where: `this.messages.length < ${roomConsts.MESSAGES_LENGTH.max}`,
    })
      .lean()
      .exec(),
  ])

  message = results[0] as LeanDocument<MessageType>
  maxMessagesRoom = results[1] as LeanDocument<RoomType>
  fewMessagesRoom = results[2] as LeanDocument<RoomType>
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
  })

  // Requirement: messages must have unique content values
  test("All params", async () => {
    const limit = 3
    const url = `${urlTrunk}?order-by=content&order=desc&limit=${limit}`
    const resNoOffset = await request(app)
      .get(url)
      .expect("Content-Type", /json/)
      .expect(200)

    const messages = resNoOffset.body["message_collection"]
    expect(messages.length).toBe(limit)

    // Check if messages belong to appropriate room
    const roomMsgStrIds = fewMessagesRoom.messages.map((msg) => msg.toString())

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
})

// No more object id checks past here
describe("POST /rooms/:roomId/messages", () => {
  let urlTrunk: string

  beforeAll(() => {
    urlTrunk = `/rooms/${fewMessagesRoom._id}/messages`
  })

  describe("Invalid body params", () => {
    describe("content", () => {
      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("content", "")
          .field("user", message.user)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("user", () => {
      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("content", message.content)
          .field("user", "")
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })
  })

  test("User not in room, at max messages", async () => {
    const url = `/rooms/${maxMessagesRoom._id}/messages`

    const res = await request(app)
      .post(url)
      .set("Content-Type", "multipart/form-data")
      .field("content", message.content)
      .field("user", "testUser")
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("User in room, at max messages", async () => {
    const url = `/rooms/${maxMessagesRoom._id}/messages`

    const message = await Message.findOne({
      user: maxMessagesRoom.users[0],
    })
      .lean()
      .exec()

    if (message === null) {
      throw new Error("Could not find a message")
    }

    await request(app)
      .post(url)
      .set("Content-Type", "multipart/form-data")
      .field("content", message.content)
      .field("user", message.user)
      .expect(200)

    const room = await Room.findById(maxMessagesRoom._id).lean().exec()

    if (room === null) {
      throw new Error("maxMessagesRoom not found in db")
    }

    // Total messages should be capped at max
    expect(room.messages.length).toBe(roomConsts.MESSAGES_LENGTH.max)
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
