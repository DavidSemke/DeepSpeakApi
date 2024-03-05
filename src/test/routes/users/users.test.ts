import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType } from "../../../types/model"
import Room from "../../../models/room"
import { setObjectIdDocument } from "../../../routes/utils/objectId"
import setupTeardown from "../setupTeardown"
import usersRouter from "../../../routes/users"

let server: MongoMemoryServer, app: Application
let maxUsersRoom: LeanDocument<RoomType>
let fewUsersRoom: LeanDocument<RoomType>

beforeAll(async () => {
  const setup = await setupTeardown.appSetup(
    usersRouter,
    "/rooms/:roomId/users",
    setObjectIdDocument("params", "roomId", Room),
  )
  server = setup.server
  app = setup.app

  const results = await Promise.all([
    Room.findOne({
      $where: "this.users.length === this.max_user_count",
    })
      .lean()
      .exec(),
    Room.findOne({
      $where:
        "this.users.length < this.max_user_count && this.users.length > 0",
    })
      .lean()
      .exec(),
  ])

  if (results[0] === null || results[1] === null) {
    throw new Error("maxUsersRoom or fewUsersRoom is null")
  }

  maxUsersRoom = results[0]
  fewUsersRoom = results[1]
})

afterAll(async () => {
  await setupTeardown.teardown(server)
})

describe("POST /rooms/:roomId/users", () => {
  let urlTrunk: string

  beforeAll(() => {
    urlTrunk = `/rooms/${fewUsersRoom._id}/users`
  })

  describe("Invalid roomId", () => {
    const urlTrunk = (roomId: string) => `/rooms/${roomId}/users`

    test("Non-existent roomId", async () => {
      await request(app)
        .post(urlTrunk("000011112222333344445555"))
        .expect("Content-Type", /json/)
        .expect(404)
    })

    test("Invalid ObjectId", async () => {
      await request(app)
        .post(urlTrunk("test"))
        .expect("Content-Type", /json/)
        .expect(400)
    })
  })

  describe("Invalid body params", () => {
    describe("user", () => {
      test("Invalid length", async () => {
        const res = await request(app)
          .post(urlTrunk)
          .set("Content-Type", "multipart/form-data")
          .field("user", "")
          .expect("Content-Type", /json/)
          .expect(400)

        expect(res.body).toHaveProperty("errors")
      })
    })
  })

  test("Room is full", async () => {
    const res = await request(app)
      .post(`/rooms/${maxUsersRoom._id}/users`)
      .set("Content-Type", "multipart/form-data")
      .field("user", "xxxxxx")
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("User already exists in room", async () => {
    const res = await request(app)
      .post(urlTrunk)
      .set("Content-Type", "multipart/form-data")
      .field("user", fewUsersRoom.users[0])
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("Valid room state", async () => {
    const user = "timothy9000"

    await request(app)
      .post(urlTrunk)
      .set("Content-Type", "multipart/form-data")
      .field("user", user)
      .expect(200)

    const room = await Room.findById(fewUsersRoom._id).lean().exec()

    if (room === null) {
      throw new Error("fewUsersRoom not found in db")
    }

    expect(room.users.includes(user)).toBe(true)
  })
})

// No more object id checks past here
describe("DELETE /rooms/:roomId/users/:userId", () => {
  let urlTrunk: string

  beforeAll(() => {
    urlTrunk = `/rooms/${fewUsersRoom._id}/users`
  })

  test("User not in room", async () => {
    const res = await request(app)
      .delete(urlTrunk + "/test")
      .expect("Content-Type", /json/)
      .expect(404)

    expect(res.body).toHaveProperty("errors")
  })

  test("User in room", async () => {
    const userToRemove = fewUsersRoom.users[0]

    await request(app).delete(`${urlTrunk}/${userToRemove}`).expect(200)

    const room = await Room.findById(fewUsersRoom._id).lean().exec()

    if (room === null) {
      throw new Error("fewUsersRoom not found in db")
    }

    expect(room.users.includes(userToRemove)).toBe(false)
  })
})
