import { Router, RequestHandler, Application } from "express"
import { MongoMemoryServer } from "mongodb-memory-server"
import populateDb from "../database/populateDb"
import mongoose from "mongoose"
import mongoConfig from "./mongoConfigTest"
import appTest from "./appTest"

type AppSetupReturn = {
  server: MongoMemoryServer
  app: Application
}

async function appSetup(
  router: Router,
  routerPath: string,
  routingMidArray: RequestHandler[] = [],
): Promise<AppSetupReturn> {
  const server = await serverSetup()
  const app = appTest.create(router, routerPath, routingMidArray)

  return { server, app }
}

async function serverSetup(): Promise<MongoMemoryServer> {
  const server = await mongoConfig.startServer()
  await populateDb()

  return server
}

async function teardown(server: MongoMemoryServer) {
  await mongoose.connection.close()
  await mongoConfig.stopServer(server)
}

export default {
  appSetup,
  teardown,
}
