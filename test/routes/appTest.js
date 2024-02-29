require("dotenv").config()
const express = require("express")
const createError = require("http-errors")

function create(router, routerPath, routingMidArray = []) {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  /* Route Setup */
  app.use((req, res, next) => {
    req.documents = {}
    next()
  })

  app.use(routerPath, routingMidArray, router)

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

module.exports = {
  create,
}
