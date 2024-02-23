const { body } = require("express-validator")
const errMsg = require("./errorMessage")

const contentLength = { min: 1, max: 300 }
const authorLength = { min: 6, max: 30 }

const message = [
  body("content")
    .isString()
    .withMessage("Content must be a string.")
    .trim()
    .isLength(contentLength)
    .withMessage((value) => {
      return errMsg.invalidLength("content", value, contentLength)
    }),
  body("author")
    .isString()
    .withMessage("Author must be a string.")
    .trim()
    .isLength(authorLength)
    .withMessage((value) => {
      return errMsg.invalidLength("author", value, authorLength)
  }),
]

module.exports = {
  message,
}
