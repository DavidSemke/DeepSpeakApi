import express, {
  Request,
  Response,
  NextFunction,
  Router,
  RequestHandler,
  Application,
} from "express"
import createError from "http-errors"

function create(
  router: Router,
  routerPath: string,
  routingMidArray: RequestHandler[] = [],
): Application {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  /* Route Setup */
  app.use((req, res, next) => {
    req.documents = {}
    next()
  })

  app.use(routerPath, routingMidArray, router)

  /* Error Handling */
  app.use(function (req, res, next) {
    next(createError(404))
  })

  app.use(function (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const errors = [{ message: err.message }]
    res.status(err.status || 500).json({ errors })
  })

  return app
}

export default {
  create,
}
