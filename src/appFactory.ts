import dotenv from "dotenv"
dotenv.config()
import RateLimit from "express-rate-limit"
import compression from "compression"
import helmet from "helmet"
import express, { Application } from "express"
import cookieParser from "cookie-parser"
import logger from "morgan"
import mongoSanitize from "express-mongo-sanitize"
import cors from 'cors'
import { Request, Response, NextFunction } from "express"
import Room from "./models/room"
import { setObjectIdDocument } from "./routes/utils/objectId"
import roomsRouter from "./routes/rooms"
import messagesRouter from "./routes/messages"
import usersRouter from "./routes/users"
import "./mongoConfig"

const isProduction = process.env.NODE_ENV === "production"

function App(): Application {
  const app = express()

  if (isProduction) {
    /* Security Setup */
    app.use(helmet())

    /* Rate limiting */
    app.use(
      // 20 requests per minute
      RateLimit({
        windowMs: 1 * 60 * 1000,
        max: 20,
      }),
    )

    /* Response compression */
    app.use(compression())
  }

  // Enable CORS
  app.use(cors({
    origin: 'https://davidsemke.github.io/DeepSpeak/'
  }))

  /* Miscellaneous Setup */
  app.use(logger("dev"))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(mongoSanitize())

  /* Route Setup */
  app.use((req, res, next) => {
    req.documents = {}
    next()
  })

  const setNoPopulateRoom = setObjectIdDocument("params", "roomId", Room)

  // Make sure less specific routes come after more specific
  // E.g. /rooms must come after all of its extensions
  app.use("/rooms/:roomId/messages", setNoPopulateRoom, messagesRouter)
  app.use("/rooms/:roomId/users", setNoPopulateRoom, usersRouter)
  app.use("/rooms", roomsRouter)

  /* Error Handling */
  app.use(function (req, res, next) {
    const err = new Error('Resource not found')
    err.status = 404

    next(err)
  })

  app.use(function (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const status = err.status || 500
    let msg = 'Internal Server Error'
    
    if (status !== 500) {
      msg = err.message
    }

    const errors = [{ message: msg }]
    
    res.status(status).json({ errors })
  })

  return app
}

export default App
