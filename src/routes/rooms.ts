import { Router } from "express"
import controller from "../controllers/rooms"
import { upload } from "./utils/multer"
import { setObjectIdDocument } from "./utils/objectId"
import Room from "../models/room"

const router = Router()

router.use(
  "/:roomId",
  setObjectIdDocument("params", "roomId", Room, ["messages"]),
)

router.get("/", controller.getManyRooms)

router.post("/", upload.none(), controller.postRoom)

router.get("/:roomId", controller.getRoom)

export default router
