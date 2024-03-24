import { query } from "express-validator"
import { Model } from "mongoose"
import Message from "../../models/message"
import Room from "../../models/room"

const notTypeErrMsg = (param: string, type: string) => {
  return `Query param '${param}' must be a ${type}`
}

const notSchemaPropErrMsg = (param: string, modelName: string) => {
  return `Query param '${param}' does not ref a prop of schema '${modelName}'`
}

function validateSort(model: Model<any>) {
  const orders = ["asc", "desc"]

  return [
    query("order-by")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("order-by", 'string'))
      .trim()
      .custom((value) => {
        return value in model.schema.paths
      })
      .withMessage(
        notSchemaPropErrMsg('order-by', model.modelName)
      ),
    query("order")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("order", 'string'))
      .trim()
      .custom((value, { req }) => {
        return req.query && req.query["order-by"] !== undefined
      })
      .withMessage(`Query param 'order' exists without query param 'order-by'`)
      .custom((value) => {
        return orders.includes(value)
      })
      .withMessage(`Query param 'order' must be in [${orders}]`),
  ]
}

function validatePagination() {
  const notOnlyDigitsErrMsg = (param: string) => {
    return `Query param '${param}' must only consist of digits`
  }
  const onlyDigitsRegex = /^\d+$/

  return [
    query("limit")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("limit", 'string'))
      .trim()
      .custom((value) => {
        return onlyDigitsRegex.test(value)
      })
      .withMessage(notOnlyDigitsErrMsg("limit")),
    query("offset")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("offset", 'string'))
      .trim()
      .custom((value) => {
        return onlyDigitsRegex.test(value)
      })
      .withMessage(notOnlyDigitsErrMsg("offset")),
  ]
}

function validatePopulation(model: Model<any>) {
  return [
    query("populate")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("offset", 'string'))
      .trim()
      .custom((value) => {
        return value in model.schema.paths
      })
      .withMessage((value) =>
        notSchemaPropErrMsg(value, model.modelName)
      ),
  ]
}

const roomSort = validateSort(Room)
const messageSort = validateSort(Message)
const pagination = validatePagination()
const roomPopulation = validatePopulation(Room)

export { roomSort, messageSort, pagination, roomPopulation }
