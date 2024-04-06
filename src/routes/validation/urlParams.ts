import { ValidationChain } from "express-validator"
import type { Validator } from '../../types/validation'


const stringErrMsg = "ObjectId must be a string"
const formatErrMsg = "Invalid ObjectId format"
const hexRegex = /^[a-f\d]{24}$/

export function objectIdValidation(
    reqObjectValidator: Validator, 
    reqObjectKey: string
  ): ValidationChain {
    return reqObjectValidator(reqObjectKey)
      .isString()
      .withMessage(stringErrMsg)
      .trim()
      .custom((value) => {
        // Must be a 24-character, lowercase, hexadecimal string
        return hexRegex.test(value)
      })
      .withMessage(formatErrMsg)
}

export function plainObjectIdValidation(objectId: unknown): string[] {
  const errors = []

  if (typeof objectId !== 'string') {
    errors.push(stringErrMsg)
    return errors
  }

  const trimmedObjectId = objectId.trim()

  if (!hexRegex.test(trimmedObjectId)) {
    errors.push(formatErrMsg)
  }

  return errors
}