import { MulterError } from "multer"
import { FlattenMaps, Types } from "mongoose"

declare global {
  namespace Express {
    interface Request {
      documents: any
      fileTypeError: boolean
      fileLimitError: MulterError
    }
  }

  interface Error {
    status?: number
  }

  type LeanDocument<DocType> = FlattenMaps<DocType> & { _id: Types.ObjectId }
}
