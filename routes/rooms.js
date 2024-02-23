const express = require('express');
const router = express.Router();
const controller = require("../controllers/rooms")
const Room = require('../models/room')
const utils = require('./utils/router')


router.use((req, res, next) => {
  req.documents = {}
  next()
})

router.use(
  "/:roomId",
  utils.setObjectIdDocument(
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
  controller.postRoom
)

router.get(
  "/:roomId",
  controller.getRoom
)

router.patch(
  "/:roomId",
  controller.patchRoom
)

router.delete(
  "/:roomId",
  controller.deleteRoom
)


module.exports = router;
