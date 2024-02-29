const express = require('express');
const router = express.Router();
const controller = require("../controllers/rooms")
const multerUtils = require('./utils/multer')
const objectIdUtils = require("./utils/objectId")
const Room = require('../models/room')


router.use(
  "/:roomId",
  objectIdUtils.setObjectIdDocument(
    "params",
    "roomId",
    Room,
    ['messages']
  )
)

router.get(
  "/",
  controller.getManyRooms
)

router.post(
  "/",
  multerUtils.upload.none(),
  controller.postRoom
)

router.get(
  "/:roomId",
  controller.getRoom
)


module.exports = router;
