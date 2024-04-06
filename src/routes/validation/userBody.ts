import { body } from "express-validator"
import { invalidLength } from "./errorMessage"
import consts from "../../models/constants/user"

const userValidation = [
  body("user")
    .isString()
    .withMessage("User must be a string")
    .trim()
    .isLength(consts.USER_LENGTH)
    .withMessage((value) => {
      return invalidLength("user", value, consts.USER_LENGTH)
    }),
]

export { userValidation }
