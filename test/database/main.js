require("dotenv").config()
const mongoose = require("mongoose")
mongoose.set("strictQuery", false)
const populateDb = require("./populateDb")

async function main() {
  console.log("Debug: About to connect")
  await mongoose.connect(process.env.MONGO_DB_CONNECT)

  console.log("Debug: Should be connected?")
  await populateDb.populate()

  console.log("Debug: Closing mongoose")
  mongoose.connection.close()
}

main().catch((err) => console.log(err))
