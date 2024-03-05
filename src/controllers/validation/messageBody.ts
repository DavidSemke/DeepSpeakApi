import { body } from "express-validator"
import { invalidLength } from "./errorMessage"
import { user } from "./userBody"
import consts from "../../models/constants/message"

const message = [
  ...user,

  body("content")
    .isString()
    .withMessage("Content must be a string")
    .trim()
    .isLength(consts.CONTENT_LENGTH)
    .withMessage((value) => {
      return invalidLength("content", value, consts.CONTENT_LENGTH)
    }),
]

export { message }
