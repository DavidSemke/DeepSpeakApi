const express = require('express');
const router = express.Router();
const controller = require("../controllers/users")
const upload = require('../utils/upload')


router.post(
  "/",
  upload.none(),
  controller.postUser
)

router.delete(
  "/:userId",
  controller.deleteUser
)


module.exports = router