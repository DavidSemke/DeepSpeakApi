const { query } = require("express-validator")
const Message = require('../../models/message')
const Room = require('../../models/room')


const notStringErrMsg = (param) => {
    return `Query param '${param}' must be a string`
}

function validateSort(model) {
    const orders = ['asc', 'desc']

    return [
        query('order-by')
            .optional()
            .isString()
            .withMessage(notStringErrMsg('order-by'))
            .trim()
            .custom((value) => {
                return value in model.schema.paths
            })
            .withMessage(
                `Query param 'order-by' does not ref a prop of schema '${model.modelName}'`
            ),
        query('order')
            .optional()
            .isString()
            .withMessage(notStringErrMsg('order'))
            .trim()
            .custom((value, { req }) => {
                return req.query['order-by'] !== undefined
            })
            .withMessage(`Query param 'order' exists without query param 'order-by'`)
            .custom((value) => {
                return orders.includes(value)
            })
            .withMessage(`Query param 'order' must be in [${orders}]`)
    ]
}

function validatePagination() {
    const notOnlyDigitsErrMsg = (param) => {
        return `Query param '${param}' must only consist of digits`
    }
    const onlyDigitsRegex = /^\d+$/

    return [
        query('limit')
            .optional()
            .isString()
            .withMessage(notStringErrMsg('limit'))
            .trim()
            .custom((value) => {
                return onlyDigitsRegex.test(value)
            })
            .withMessage(notOnlyDigitsErrMsg('limit')),
        query('offset')
            .optional()
            .isString()
            .withMessage(notStringErrMsg('offset'))
            .trim()
            .custom((value) => {
                return onlyDigitsRegex.test(value)
            })
            .withMessage(notOnlyDigitsErrMsg('offset')),
    ]
}

const roomSort = validateSort(Room)
const messageSort = validateSort(Message)
const pagination = validatePagination()


module.exports = {
    roomSort,
    messageSort,
    pagination
}