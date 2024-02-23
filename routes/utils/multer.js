const multer = require("multer")


function handleMulterError(err, req, res, next) {
    if (!err) {
      return next()
    }
  
    if (err instanceof multer.MulterError) {
      req.fileLimitError = err
  
      return next()
    }
  
    next(err)
  }


module.exports = {
    handleMulterError,
}