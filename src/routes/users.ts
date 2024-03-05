import { Router } from "express"
import controller from "../controllers/users"
import { upload } from "./utils/multer"

const router = Router()

router.post("/", upload.none(), controller.postUser)

router.delete("/:userId", controller.deleteUser)

export default router
