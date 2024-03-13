import { MulterError } from "multer"
import { FlattenMaps, Types } from "mongoose"

declare global {
  namespace Express {
    interface Request {
      documents: {
        [key: string]: any
      }
      user: {
        username: string,
        roomId: string
      }
      fileTypeError: boolean
      fileLimitError: MulterError
    }
  }

  interface Error {
    status?: number
  }

  type LeanDocument<DocType> = FlattenMaps<DocType> & { _id: Types.ObjectId }
}
