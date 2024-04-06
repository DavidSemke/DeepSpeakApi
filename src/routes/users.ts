import { Router } from "express"
import controller from "../controllers/users"
import { upload } from "./utils/multer"
import { authenticateToken } from "../utils/auth"
import { userValidation } from "./validation/userBody"

const router = Router()

router.post(
    "/", 
    upload.none(),
    userValidation, 
    controller.postUser
)

router.delete(
    "/:userId",
    authenticateToken,
    controller.deleteUser
)

export default router
