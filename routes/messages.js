const express = require('express');
const router = express.Router();
const controller = require("../controllers/messages")
const Message = require('../models/message')
const upload = require('../utils/upload')
const objectIdUtils = require('./utils/objectId')


router.use((req, res, next) => {
  req.documents = {}
  next()
})
  
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
  upload.none(),
  controller.postMessage
)

router.get(
  "/:messageId",
  controller.getMessage
)


module.exports = router