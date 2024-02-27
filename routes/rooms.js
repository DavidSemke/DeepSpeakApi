const express = require('express');
const router = express.Router();
const controller = require("../controllers/rooms")
const upload = require('../utils/upload')


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


module.exports = router;
