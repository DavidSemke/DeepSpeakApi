import dotenv from "dotenv"
dotenv.config()
import mongoose from "mongoose"
import populateDb from "./populateDb"

mongoose.set("strictQuery", false)

async function main() {
  console.log("Debug: About to connect")
  await mongoose.connect(process.env.MONGO_DB_CONNECT as string)

  console.log("Debug: Should be connected?")
  await populateDb()

  console.log("Debug: Closing mongoose")
  mongoose.connection.close()
}

main().catch((err) => console.log(err))
