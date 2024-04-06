import { query } from "express-validator"
import { Model } from "mongoose"
import Message from "../../models/message"
import Room from "../../models/room"
import { plainObjectIdValidation
 } from "./urlParams"

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

function validatepaginationValidation() {
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

function validateIds() {
  return [
    query("ids")
      .optional()
      .isString()
      .withMessage(notTypeErrMsg("ids", 'string'))
      .trim()
      .custom((value) => {
        const ids = value.split(',')

        for (const id of ids) {
          if (plainObjectIdValidation(id).length) {
            return false
          }
        }

        return true
      })
      .withMessage('Invalid ObjectId format')
  ]
}

const roomSortValidation = validateSort(Room)
const messageSortValidation = validateSort(Message)
const paginationValidation = validatepaginationValidation()
const roomPopulationValidation = validatePopulation(Room)
const idValidation = validateIds()

export { 
  roomSortValidation, 
  messageSortValidation, 
  paginationValidation, 
  roomPopulationValidation,
  idValidation
}
