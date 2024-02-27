const populateDb = require("../database/populateDb")
const mongoose = require("mongoose")
const mongoConfig = require("./mongoConfigTest")
const appTest = require("./appTest")

async function appSetup(router, routerPath) {
  const server = await serverSetup()
  const app = appTest.create(router, routerPath)

  return { server, app }
}

async function serverSetup() {
  const server = await mongoConfig.startServer()
  await populateDb.populate()

  return server
}

async function teardown(server) {
  await mongoose.connection.close()
  await mongoConfig.stopServer(server)
}

module.exports = {
  appSetup,
  teardown,
}
