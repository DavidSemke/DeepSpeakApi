function findMany(model) {
    return asyncHandler(async (req, res, next) => {
        const errors = validationResult(req).array()
    
        if (errors.length) {
            res.status(400).json({ errors })
            return
        }
    
        const orderBy = req.query['order-by']
        const order = req.query['order']
        const limit = req.query['limit']
        const offset = req.query['offset']
    
        const query = model.find().lean()
    
        if (orderBy) {
            query.sort({ [orderBy]: order || 'asc' })
        }
    
        if (limit) {
            query.limit(limit)
        }
    
        if (offset) {
            query.offset(offset)
        }
    
        const documents = await query.exec()
        const documentType = model.modelName.toLowerCase()
        const plural = documentType + '_collection'
    
        res.json({ [plural]: documents })
    })
}

module.exports = {
    findMany
}