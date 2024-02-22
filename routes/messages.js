const express = require('express');
const router = express.Router();
const controller = require("../controllers/messages")
const Message = require('../models/message')
const utils = require('./utils/router')


router.use((req, res, next) => {
  req.documents = {}
  next()
})
  
router.use(
    "/:messageId",
    utils.setObjectIdDocument(
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
  controller.postMessage
)

router.get(
  "/:messageId",
  controller.getMessage
)


module.exports = router