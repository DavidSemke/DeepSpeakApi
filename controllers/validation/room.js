const { body } = require("express-validator")
const errMsg = require("./errorMessage")


const topicLength = { min: 10, max: 100 }
const minUserCount = 2
const maxUserCount = 10

const postRoom = [
  body("topic")
    .isString()
    .withMessage("Topic must be a string.")
    .trim()
    .isLength(topicLength)
    .withMessage((value) => {
      return errMsg.invalidLength("topic", value, topicLength)
    }),
  body("max-user-count")
    .isNumeric()
    .withMessage("Max user count must be numeric.")
    .custom((value) => {
      const count = parseInt(value)
      return count >= minUserCount && count <= maxUserCount
    })
    .withMessage(
      `Max user count must be in range [${minUserCount}, ${maxUserCount}].`
    )
]

const patchRoom = [
  body("user-count")
    .isNumeric()
    .withMessage("User count must be numeric.")
    .custom((value) => {
      const count = parseInt(value)
      return count >= minUserCount && count <= maxUserCount
    })
    .withMessage(
      `User count must be in range [${minUserCount}, ${maxUserCount}].`
    )
]


module.exports = {
  postRoom,
  patchRoom
}