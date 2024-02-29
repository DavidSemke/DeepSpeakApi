const { body } = require("express-validator")
const errMsg = require("./errorMessage")
const consts = require('../../models/constants/user')


const user = [
  body("user")
    .isString()
    .withMessage("User must be a string")
    .trim()
    .isLength(consts.USER_LENGTH)
    .withMessage((value) => {
      return errMsg.invalidLength("user", value, consts.USER_LENGTH)
  }),
]

module.exports = {
  user,
}