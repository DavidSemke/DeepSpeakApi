const express = require('express');
const router = express.Router();
const controller = require("../controllers/rooms")
const Room = require('../models/room')
const upload = require('../utils/upload')
const objectIdUtils = require('./utils/objectId')


router.use((req, res, next) => {
  req.documents = {}
  next()
})

router.use(
  "/:roomId",
  objectIdUtils.setObjectIdDocument(
    "params",
    "roomId",
    Room,
    ["messages"],
  )
)

router.get(
  "/",
  controller.getManyRooms
)

router.post(
  "/",
  upload.none(),
  controller.postRoom
)

router.get(
  "/:roomId",
  controller.getRoom
)

router.patch(
  "/:roomId",
  upload.none(),
  controller.patchRoom
)

router.delete(
  "/:roomId",
  controller.deleteRoom
)


module.exports = router;
