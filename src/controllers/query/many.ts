import asyncHandler from "express-async-handler"
import { validationResult } from "express-validator"
import { Model } from "mongoose"


type FindManyFilter = {
  _id?: {
    $in: string[]
  }
}

function findMany(
  model: Model<any>, 
  filter: FindManyFilter = {}, 
  usePopulation=false
) {
  return asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array()

    if (errors.length) {
      res.status(400).json({ errors })
      return
    }

    const orderBy = req.query["order-by"]
    const limit = Number(req.query["limit"])
    const offset = Number(req.query["offset"])
    const populate = req.query['populate']
    const queryIds = req.query['ids']

    if (typeof queryIds === 'string') {
      const queryIdArray = queryIds.split(',')

      // If filter._id.$in already exists, ids from query
      // must form a subset (otherwise they are ignored)
      if (filter._id?.$in !== undefined) {
        const inArray = filter._id?.$in
          .map(id => id.toString())
        const subsetInArray = inArray
          .filter((id) => queryIdArray.includes(id))

        filter._id.$in = subsetInArray
      }
      else if (filter._id !== undefined) {
        filter._id.$in = queryIdArray
      }
      else {
        filter._id = { $in: queryIdArray }
      }
    }

    const query = model.find(filter).lean()

    if (typeof orderBy === "string") {
      const order = req.query["order"]
      let sortStr = orderBy

      if (order === "desc") {
        sortStr = "-" + orderBy
      }

      query.sort(sortStr)
    }

    if (typeof limit === 'number' && !isNaN(limit)) {
      query.limit(limit)
    }

    if (typeof offset === 'number' && !isNaN(offset)) {
      query.skip(offset)
    }

    if (
      usePopulation
      && typeof populate === 'string'
    ) {
      query.populate(populate)
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