import { Router } from "express"
import controller from "../controllers/messages"
import Message from "../models/message"
import { upload } from "./utils/multer"
import { setObjectIdDocument } from "./utils/objectId"

const router = Router()

router.use("/:messageId", setObjectIdDocument("params", "messageId", Message))

router.get("/", controller.getManyMessages)

router.post("/", upload.none(), controller.postMessage)

router.get("/:messageId", controller.getMessage)

export default router
