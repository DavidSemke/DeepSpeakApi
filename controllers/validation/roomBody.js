const { body } = require("express-validator")
const errMsg = require("./errorMessage")
const consts = require('../../models/consts/room')


const postRoom = [
  body("topic")
    .isString()
    .withMessage("Topic must be a string.")
    .trim()
    .isLength(consts.TOPIC_LENGTH)
    .withMessage((value) => {
      return errMsg.invalidLength("topic", value, consts.TOPIC_LENGTH)
    }),
  body("max-user-count")
    .isNumeric()
    .withMessage("Max user count must be numeric.")
    .custom((value) => {
      const count = parseInt(value)
      const { min, max } = consts.MAX_USER_COUNT_LENGTH

      return count >= min && count <= max
    })
    .withMessage(
      `Max user count must be in range [${min}, ${max}].`
    )
]


module.exports = {
  postRoom
}