import { body } from "express-validator"
import { invalidLength } from "./errorMessage"
import consts from "../../models/constants/room"

const room = [
  body("topic")
    .isString()
    .withMessage("Topic must be a string")
    .trim()
    .isLength(consts.TOPIC_LENGTH)
    .withMessage((value) => {
      return invalidLength("topic", value, consts.TOPIC_LENGTH)
    }),
  body("max-user-count")
    .isNumeric()
    .withMessage("Max user count must be numeric")
    .custom((value) => {
      const count = parseInt(value)
      const { min, max } = consts.MAX_USER_COUNT_LENGTH

      return count >= min && count <= max
    })
    .withMessage(() => {
      const { min, max } = consts.MAX_USER_COUNT_LENGTH
      return `Max user count must be in range [${min}, ${max}]`
    }),
]

export { room }
