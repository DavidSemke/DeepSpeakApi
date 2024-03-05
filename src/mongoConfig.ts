import dotenv from "dotenv"
dotenv.config()
import mongoose from "mongoose"

const connecter = process.env.MONGO_DB_CONNECT as string
mongoose.connect(connecter)
const db = mongoose.connection
db.on("error", console.error.bind(console, "mongo connection error"))
