const express = require('express');
const router = express.Router();
const controller = require("../controllers/messages")
const Message = require('../models/message')
const multerUtils = require('./utils/multer')
const objectIdUtils = require('./utils/objectId')


router.use(
    "/:messageId",
    objectIdUtils.setObjectIdDocument(
        "params",
        "messageId",
        Message
    )
)
  
router.get(
  "/",
  controller.getManyMessages
)

router.post(
  "/",
  multerUtils.upload.none(),
  controller.postMessage
)

router.get(
  "/:messageId",
  controller.getMessage
)


module.exports = router