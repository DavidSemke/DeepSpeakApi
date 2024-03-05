import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

async function startServer(): Promise<MongoMemoryServer> {
  const mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  await mongoose.connect(mongoUri)

  mongoose.connection.on("error", (e) => {
    console.log(e)
  })

  return mongoServer
}

async function stopServer(server: MongoMemoryServer) {
  await server.stop()
}

export default {
  startServer,
  stopServer,
}
