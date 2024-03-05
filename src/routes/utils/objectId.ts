import { RequestHandler } from "express"
import asyncHandler from "express-async-handler"
import { param, body } from "express-validator"
import { validationResult } from "express-validator"
import { Model } from "mongoose"

function setObjectIdDocument(
  reqObject: string,
  reqObjectKey: string,
  model: Model<any>,
  populatePaths: any[] = [],
): RequestHandler[] {
  let reqObjectValidator

  if (reqObject === "params") {
    reqObjectValidator = param
  } else if (reqObject === "body") {
    reqObjectValidator = body
  } else {
    throw new Error("Param reqObject must be in ['params, body']")
  }

  return [
    reqObjectValidator(reqObjectKey)
      .isString()
      .withMessage("ObjectId must be a string")
      .trim()
      .custom((value) => {
        // Must be a 24-character, lowercase, hexadecimal string
        const hexRegex = /^[a-f\d]{24}$/
        return hexRegex.test(value)
      })
      .withMessage("Invalid ObjectId format"),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req).array()

      if (errors.length) {
        res.status(400).json({ errors })
        return
      }

      const objectId = req[reqObject][reqObjectKey]
      const query = model.findById(objectId).lean()

      for (const path of populatePaths) {
        query.populate(path)
      }

      const document = await query.exec()

      if (document === null) {
        const err = new Error("Resource not found")
        err.status = 404

        return next(err)
      }

      req.documents[reqObjectKey] = document

      next()
    }),
  ]
}

export { setObjectIdDocument }
