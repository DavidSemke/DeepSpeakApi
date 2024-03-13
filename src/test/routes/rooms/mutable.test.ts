import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType } from "../../../types/model"
import Room from "../../../models/room"
import setupTeardown from "../setupTeardown"
import roomsRouter from "../../../routes/rooms"

let server: MongoMemoryServer, app: Application
let room: LeanDocument<RoomType>

beforeEach(async () => {
  const setup = await setupTeardown.appSetup(roomsRouter, "/rooms")
  server = setup.server
  app = setup.app

  room = (await Room.findOne().lean().exec()) as LeanDocument<RoomType>
})

afterEach(async () => {
  await setupTeardown.teardown(server)
})

describe("POST /rooms", () => {
    const urlTrunk = "/rooms"

    // Requirement: All test room topics are unique
    test("All inputs", async () => {
      await request(app)
        .post(urlTrunk)
        .set("Content-Type", "multipart/form-data")
        .field("topic", room.topic)
        .field("max-user-count", room.max_user_count)
        .expect(200)
  
      const rooms = await Room.find({ topic: room.topic }).lean().exec()
  
      expect(rooms.length).toBe(2)
    })
})