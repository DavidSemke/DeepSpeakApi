const request = require("supertest")
const Message = require("../../../models/message")
const Room = require("../../../models/room")
const objectIdUtils = require("../../../routes/utils/objectId")
const setupTeardown = require("../setupTeardown")
const messagesRouter = require("../../../routes/messages")
const roomConsts = require("../../../models/constants/room")

let server, app
// fewMessagesRoom is default room
// maxMessagesRoom is only used when max messages required
let message, maxMessagesRoom, fewMessagesRoom

beforeAll(async () => {
  const setup = await setupTeardown.appSetup(
    messagesRouter,
    "/rooms/:roomId/messages",
    objectIdUtils.setObjectIdDocument("params", "roomId", Room),
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

  message = results[0]
  maxMessagesRoom = results[1]
  fewMessagesRoom = results[2]
})

afterAll(async () => {
  await setupTeardown.teardown(server)
})

describe("GET /rooms/:roomId/messages", () => {
  let urlTrunk

  beforeAll(() => {
    urlTrunk = `/rooms/${fewMessagesRoom._id}/messages`
  })

  describe("Invalid roomId", () => {
    const urlTrunk = (roomId) => `/rooms/${roomId}/messages`

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

  test("All params", async () => {
    const limit = 3
    const url = `${urlTrunk}?order-by=create_date&order=desc&limit=${limit}`
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
      expect(msg.create_date >= nextMsg.create_date)
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
  let urlTrunk

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

    await request(app)
      .post(url)
      .set("Content-Type", "multipart/form-data")
      .field("content", message.content)
      .field("user", message.user)
      .expect(200)

    const room = await Room.findById(maxMessagesRoom._id).lean().exec()

    // Total messages should be capped at max
    expect(room.messages.length).toBe(roomConsts.MESSAGES_LENGTH.max)
  })
})

describe("GET /rooms/:roomId/messages/:messageId", () => {
  let roomMessage, nonRoomMessage

  beforeAll(async () => {
    roomMessage = await Message.findOne({
      _id: { $in: fewMessagesRoom.messages },
    })
      .lean()
      .exec()
    nonRoomMessage = await Message.findOne({
      _id: { $nin: fewMessagesRoom.messages },
    })
      .lean()
      .exec()
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
