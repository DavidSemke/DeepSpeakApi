import { RequestHandler } from "express"
import asyncHandler from "express-async-handler"
import { 
  param, 
  body, 
  validationResult 
} from "express-validator"
import { Model } from "mongoose"
import { objectIdValidation } from "../validation/urlParams"
import type { Validator } from '../../types/validation'


function setObjectIdDocument(
  reqObject: string,
  reqObjectKey: string,
  model: Model<any>,
  populatePaths: any[] = [],
): RequestHandler[] {
  let reqObjectValidator: Validator

  if (reqObject === "params") {
    reqObjectValidator = param
  } else if (reqObject === "body") {
    reqObjectValidator = body
  } else {
    throw new Error("Param reqObject must be in ['params, body']")
  }

  return [
    objectIdValidation(reqObjectValidator, reqObjectKey),

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
