const express = require('express');
const router = express.Router();
const controller = require("../controllers/users")
const multerUtils = require('./utils/multer')


router.post(
  "/",
  multerUtils.upload.none(),
  controller.postUser
)

router.delete(
  "/:userId",
  controller.deleteUser
)


module.exports = router