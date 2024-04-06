import { Router } from "express"
import controller from "../controllers/rooms"
import { upload } from "./utils/multer"
import { setObjectIdDocument } from "./utils/objectId"
import Room from "../models/room"
import { 
  idValidation,
  paginationValidation, 
  roomPopulationValidation, 
  roomSortValidation 
} from "./validation/queryParams"
import { roomValidation } from "./validation/roomBody"

const router = Router()

router.use(
  "/:roomId",
  setObjectIdDocument("params", "roomId", Room, ["messages"]),
)

router.get(
  "/",
  roomSortValidation,
  paginationValidation,
  roomPopulationValidation,
  idValidation, 
  controller.getManyRooms
)

router.post(
  "/",
  upload.none(),
  roomValidation,
  controller.postRoom
)

router.get("/:roomId", controller.getRoom)

export default router
