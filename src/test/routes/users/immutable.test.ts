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

  test("User was deleted from room", async () => {
    const deletedUser = fewUsersRoom.deleted_users[0]
    const res = await request(app)
      .post(urlTrunk)
      .set("Content-Type", "multipart/form-data")
      .field("user", deletedUser)
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
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

  beforeAll(() => {
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

  test("Not authenticated", async () => {
    const res = await request(app)
      .delete(urlTrunk + "/test")
      .expect("Content-Type", /json/)
      .expect(401)

    expect(res.body).toHaveProperty("errors")
  })
  
  test("Authenticated for a different room", async () => {
    const res = await request(app)
      .delete(`${urlTrunk}/${fewUsersRoomAuth.user.username}`)
      .set("Authorization", `Bearer ${maxUsersRoomAuth.token}`)
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("Deleting user other than self", async () => {
    const res = await request(app)
      .delete(`${urlTrunk}/${fewUsersRoom.users[1]}`)
      .set("Authorization", `Bearer ${fewUsersRoomAuth.token}`)
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })

  test("User deleted from room", async () => {
    const user = {
      username: fewUsersRoom.deleted_users[0],
      roomId: fewUsersRoom._id
    }
    const auth = {
      user,
      token: generateAuthToken(user)
    }
    
    // try to delete self as deleted user
    const res = await request(app)
      .delete(`${urlTrunk}/${auth.user.username}`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect("Content-Type", /json/)
      .expect(403)

    expect(res.body).toHaveProperty("errors")
  })
})
