import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import { Model } from "mongoose"

function findMany(model: Model<any>, filter = {}) {
  return asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const orderBy = req.query["order-by"]
    const limit = Number(req.query["limit"])
    const offset = Number(req.query["offset"])

    const query = model.find(filter).lean()

    if (typeof orderBy === "string") {
      const order = req.query["order"]
      let sortStr = orderBy

      if (order === "desc") {
        sortStr = "-" + orderBy
      }

      query.sort(sortStr)
    }

    if (limit) {
      query.limit(limit)
    }

    if (offset) {
      query.skip(offset)
    }

    const documents = await query.exec()
    const documentType = model.modelName.toLowerCase()
    const plural = documentType + "_collection"

    res.json({ [plural]: documents })
  })
}

export = {
  findMany,
}
