require("dotenv").config()
const RateLimit = require("express-rate-limit")
const compression = require("compression")
const helmet = require("helmet")
const createError = require("http-errors")
const express = require("express")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const mongoSanitize = require("express-mongo-sanitize")
const Room = require("./models/room")
const objectIdUtils = require("./routes/utils/objectId")
require("./mongoConfig")

const isProduction = process.env.NODE_ENV === "production"

function App() {
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

  const roomsRouter = require("./routes/rooms")
  const messagesRouter = require("./routes/messages")
  const usersRouter = require("./routes/users")
  const setNoPopulateRoom = objectIdUtils.setObjectIdDocument(
    "params",
    "roomId",
    Room,
  )

  // Make sure less specific routes come after more specific
  // E.g. /rooms must come after all of its extensions
  app.use("/rooms/:roomId/messages", setNoPopulateRoom, messagesRouter)
  app.use("/rooms/:roomId/users", setNoPopulateRoom, usersRouter)
  app.use("/rooms", roomsRouter)

  /* Error Handling */
  app.use(function (req, res, next) {
    next(createError(404))
  })

  app.use(function (err, req, res, next) {
    const errors = [{ message: err.message }]
    res.status(err.status || 500).json({ errors })
  })

  return app
}

module.exports = App
