import { Router } from "express"
import controller from "../controllers/messages"
import Message from "../models/message"
import { upload } from "./utils/multer"
import { setObjectIdDocument } from "./utils/objectId"
import { authenticateToken } from "../utils/auth"
import { idValidation, messageSortValidation, paginationValidation } from "./validation/queryParams"
import { messageValidation } from "./validation/messageBody"

const router = Router()

router.use(
    "/:messageId", 
    setObjectIdDocument("params", "messageId", Message)
)

router.get(
    "/",
    messageSortValidation,
    paginationValidation,
    idValidation, 
    controller.getManyMessages
)

router.post(
    "/",
    authenticateToken,
    upload.none(),
    messageValidation, 
    controller.postMessage
)

router.get("/:messageId", controller.getMessage)

export default router
