import { Router } from "express"
import controller from "../controllers/users"
import { upload } from "./utils/multer"
import { authenticateToken } from "../utils/auth"

const router = Router()

router.post("/", upload.none(), controller.postUser)

router.delete(
    "/:userId",
    authenticateToken,
    controller.deleteUser
)

export default router
