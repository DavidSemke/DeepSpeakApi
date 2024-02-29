const { body } = require("express-validator")
const errMsg = require("./errorMessage")
const userBody = require("./userBody")
const consts = require("../../models/constants/message")

const message = [
  ...userBody.user,

  body("content")
    .isString()
    .withMessage("Content must be a string")
    .trim()
    .isLength(consts.CONTENT_LENGTH)
    .withMessage((value) => {
      return errMsg.invalidLength("content", value, consts.CONTENT_LENGTH)
    }),
]

module.exports = {
  message,
}
