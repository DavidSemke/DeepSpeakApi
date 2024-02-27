const request = require("supertest");
const Message = require('../../../models/message')
const Room = require('../../../models/room')
const setupTeardown = require('../utils/setupTeardown')
const messagesRouter = require("../../../routes/messages")
const roomConsts = require('../../../models/constants/room')

let server, app
let message, maxMessagesRoom, fewMessagesRoom

// No updates/deletes target database, so no need for beforeEach
beforeAll(async () => {
  const setup = await setupTeardown.appSetup(
    messagesRouter, 
    '/rooms/:roomId/messages'
  )
  server = setup.server
  app = setup.app

  message = await Message
    .findOne()
    .lean()
    .exec()
  
  // This room may use duplicate messages (messages with same id)
  maxMessagesRoom = await Room
    .findOne({
      messages: { $size: roomConsts.MESSAGES_LENGTH.max }
    })
    .lean()
    .exec()
  
  // This room should not use duplicate messages 
  fewMessagesRoom = await Room
    .findOne({
      messages: { $size: { $gt: 5, $lt: 11 } }
    })
    .lean()
    .exec()
})

afterAll(async () => {
  await setupTeardown.teardown(server)
})

describe("GET /rooms/:roomId/messages", () => {
  const urlTrunk = `/rooms/:${fewMessagesRoom._id}/messages`

  describe("Invalid roomId", () => {
    const urlTrunk = (roomId) => `/rooms/:${roomId}/messages`

    test("Non-existent roomId", async () => {
      await request(app)
        .get(urlTrunk('000011112222333344445555'))
        .expect("Content-Type", /json/)
        .expect(404);
    });
  
    test("Invalid ObjectId", async () => {
      await request(app)
        .get(urlTrunk('test'))
        .expect("Content-Type", /json/)
        .expect(400);
    });
  })

  describe("Invalid query params", () => {
    describe("Order-by", () => {
      test("Does not ref Message schema prop", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order-by=`)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })

    describe("Order", () => {
      test("Not in ['asc', 'desc']", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order=test`)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });

      test("Exists without order-by", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?order=asc`)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })
    
    describe("Limit", () => {
      test("Includes non-digits", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?limit=-1`)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })

    describe("Offset", () => {
      test("Includes non-digits", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?offset=-1`)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })
  })

  test("All params", async () => {
    const limit = 3
    const resNoOffset = await request(app)
      .get(`${urlTrunk}?order-by=create_date&order=desc&limit=${limit}`)
      .expect("Content-Type", /json/)
      .expect(200);
    
    expect(resNoOffset.body).toHaveProperty('message_collection')
    const messages = resNoOffset.body['message_collection']
    expect(messages.length).toBe(limit)

    for (let i=0; i<messages.length-1; i++) {
      const msg = messages[i]
      const nextMsg = messages[i+1]

      // Check if order=desc produced correct results
      expect(msg.create_date >= nextMsg.create_date)
    }

    // Make another request with offset; returned messages should all be new
    const offset = limit
    const resOffset = await request(app)
      .get(`${urlTrunk}?limit=${limit}&offset=${offset}`)
      .expect("Content-Type", /json/)
      .expect(200);
  
    const newMessages = resOffset.body['message_collection']

    for (const newMsg of newMessages) {
      for (const oldMsg of messages) {
        expect(oldMsg).not.toEqual(newMsg)
      }
    }
  });
})

// No more object id checks past here
describe("POST /rooms/:roomId/messages", () => {
  const urlTrunk = `/rooms/${fewMessagesRoom._id}/messages`

  describe("Invalid body params", () => {
    describe("content", () => {
      test("Not a string", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set('Content-Type', "multipart/form-data")
          .field("content", 0)
          .field("user", message.user)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });

      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set('Content-Type', "multipart/form-data")
          .field("content", '')
          .field("user", message.user)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })

    describe("user", () => {
      test("Not a string", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set('Content-Type', "multipart/form-data")
          .field("content", message.content)
          .field("user", 0)
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });

      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set('Content-Type', "multipart/form-data")
          .field("content", message.content)
          .field("user", '')
          .expect("Content-Type", /json/)
          .expect(400);
        
        expect(res.body).toHaveProperty('errors')
      });
    })
  })

  test("User not in room, at max messages", async () => {
    await request(app)
      .post(`/rooms/${maxMessagesRoom._id}/messages`)
      .set('Content-Type', "multipart/form-data")
      .field("content", message.content)
      .field("user", 'testUser')
      .expect("Content-Type", /json/)
      .expect(403);
    
    expect(res.body).toHaveProperty('errors')
  });

  test("User in room, at max messages", async () => {
    const message = await Message
      .findOne({
        user: maxMessagesRoom.users[0]
      })
      .lean()
      .exec()

    await request(app)
      .post(`/rooms/${maxMessagesRoom._id}/messages`)
      .set('Content-Type', "multipart/form-data")
      .field("content", message.content)
      .field("user", message.user)
      .expect(200);

    const room = await Room
      .findById(maxMessagesRoom._id)
      .lean()
      .exec()
    
    // Total messages should be capped at max
    expect(room.messages.length).toBe(roomConsts.MESSAGES_LENGTH.max)
  });
})

describe("GET /rooms/:roomId/messages/:messageId", () => {
  const url = `/rooms/:${fewMessagesRoom._id}/messages/${message._id}`

  test("GET", async () => {
    const res = await request(app)
      .get(url)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty('message')
  });
})