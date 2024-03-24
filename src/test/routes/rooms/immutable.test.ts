import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType } from "../../../types/model"
import Room from "../../../models/room"
import setupTeardown from "../setupTeardown"
import roomsRouter from "../../../routes/rooms"
import roomConsts from "../../../models/constants/room"

let server: MongoMemoryServer, app: Application
let room: LeanDocument<RoomType>

beforeAll(async () => {
  const setup = await setupTeardown.appSetup(roomsRouter, "/rooms")
  server = setup.server
  app = setup.app

  room = (await Room.findOne().lean().exec()) as LeanDocument<RoomType>
})

afterAll(async () => {
  await setupTeardown.teardown(server)
})

describe("GET /rooms", () => {
  const urlTrunk = "/rooms"

  describe("Invalid query params", () => {
    describe("Order-by", () => {
      test("Does not ref Room schema prop", async () => {
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

    describe("Populate", () => {
      test("Does not refer to a schema property", async () => {
        const res = await request(app)
          .get(`${urlTrunk}?populate=trash`)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })
  })

  // Requirement: rooms must have unique topic values
  test("All params", async () => {
    const limit = 3
    const url = `${urlTrunk}?order-by=topic&order=desc&limit=${limit}&populate=messages`
    const resNoOffset = await request(app)
      .get(url)
      .expect("Content-Type", /json/)
      .expect(200)

    const rooms = resNoOffset.body["room_collection"]
    expect(rooms.length).toBe(limit)

    // Check if order=desc produced correct results
    for (let i = 0; i < rooms.length - 1; i++) {
      const room = rooms[i]
      const nextRoom = rooms[i + 1]
      expect(room.topic >= nextRoom.topic)
    }

    // Make another request with offset; returned rooms should all be new
    const offset = limit
    const resOffset = await request(app)
      .get(`${url}&offset=${offset}`)
      .expect("Content-Type", /json/)
      .expect(200)

    const newRooms = resOffset.body["room_collection"]

    for (const newRoom of newRooms) {
      for (const oldRoom of rooms) {
        expect(oldRoom).not.toEqual(newRoom)
      }
    }
  })
})

describe("POST /rooms", () => {
  const urlTrunk = "/rooms"

  describe("Invalid body params", () => {
    describe("topic", () => {
      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("topic", "")
          .field("max-user-count", room.max_user_count)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })

    describe("max-user-count", () => {
      test("Not numeric", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("topic", room.topic)
          .field("max-user-count", "test")
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })

      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("topic", room.topic)
          .field("max-user-count", roomConsts.MAX_USER_COUNT_LENGTH.min - 1)
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })
  })
})

describe("GET /rooms/:roomId", () => {
  const urlTrunk = "/rooms"

  describe("Invalid roomId", () => {
    test("Non-existent roomId", async () => {
      await request(app)
        .get(`${urlTrunk}/000011112222333344445555`)
        .expect("Content-Type", /json/)
        .expect(404)
    })

    test("Invalid ObjectId", async () => {
      await request(app)
        .get(`${urlTrunk}/test`)
        .expect("Content-Type", /json/)
        .expect(400)
    })
  })

  test("GET", async () => {
    const res = await request(app)
      .get(`${urlTrunk}/${room._id}`)
      .expect("Content-Type", /json/)
      .expect(200)

    expect(res.body).toHaveProperty("room")
  })
})
