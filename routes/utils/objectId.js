const asyncHandler = require("express-async-handler")
const { ObjectId } = require("mongoose").Types


function setObjectIdDocument(
  reqObject,
  param,
  model,
  populatePaths = [],
) {
  return asyncHandler(async (req, res, next) => {
    let objectId

    try {
      objectId = ObjectId(req[reqObject][param])
    } catch (error) {
      const err = new Error("Invalid ObjectId format")
      err.status = 400

      return next(err)
    }

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

    req.documents[param] = document

    next()
  })
}



module.exports = {
  setObjectIdDocument,
}
