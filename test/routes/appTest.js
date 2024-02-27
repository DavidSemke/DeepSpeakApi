require("dotenv").config()
const express = require("express")
const createError = require("http-errors")


function create(router, routerPath) {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(routerPath, router)

  /* Error Handling */
  app.use(function (req, res, next) {
    next(createError(404))
  })

  app.use(function (err, req, res, next) {
    const errors = [err]
    res.status(err.status || 500).json({ errors })
  })

  return app
}

module.exports = {
  create,
}
