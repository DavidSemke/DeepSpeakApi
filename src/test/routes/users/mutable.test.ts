import request from "supertest"
import { Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import { RoomType } from "../../../types/model"
import Room from "../../../models/room"
import { setObjectIdDocument } from "../../../routes/utils/objectId"
import setupTeardown from "../setupTeardown"
import usersRouter from "../../../routes/users"
import { generateAuthToken } from "../../../utils/auth"
import { UserType } from "../../../types/model"

let server: MongoMemoryServer, app: Application
let maxUsersRoom: LeanDocument<RoomType>
let fewUsersRoom: LeanDocument<RoomType>

beforeEach(async () => {
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

afterEach(async () => {
  await setupTeardown.teardown(server)
})

describe("POST /rooms/:roomId/users", () => {
    let urlTrunk: string
  
    beforeEach(() => {
      urlTrunk = `/rooms/${fewUsersRoom._id}/users`
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
    type Auth = {
      user: UserType,
      token: string
    }
  
    let urlTrunk: string
    let maxUsersRoomAuth: Auth
    let fewUsersRoomAuth: Auth
  
    beforeEach(() => {
      urlTrunk = `/rooms/${fewUsersRoom._id}/users`
      const maxUsersRoomUser = {
        username: maxUsersRoom.users[0],
        roomId: maxUsersRoom._id
      }
      maxUsersRoomAuth = {
        user: maxUsersRoomUser,
        token: generateAuthToken(maxUsersRoomUser)
      }
      const fewUsersRoomUser = {
        username: fewUsersRoom.users[0],
        roomId: fewUsersRoom._id
      }
      fewUsersRoomAuth = {
        user: fewUsersRoomUser,
        token: generateAuthToken(fewUsersRoomUser)
      }
    })
    
    test("Delete", async () => {
      const userToRemove = fewUsersRoomAuth.user.username
      await request(app)
        .delete(`${urlTrunk}/${userToRemove}`)
        .set("Authorization", `Bearer ${fewUsersRoomAuth.token}`)
        .expect(200)
  
      const room = await Room.findById(fewUsersRoom._id).lean().exec()
  
      if (room === null) {
        throw new Error("fewUsersRoom not found in db")
      }
  
      expect(room.users.includes(userToRemove)).toBe(false)
    })
  })
  