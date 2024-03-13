import express, {
  Request,
  Response,
  NextFunction,
  Router,
  RequestHandler,
  Application,
} from "express"

function App(
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
    const err = new Error('Resource not found')
    err.status = 404

    console.log(req.url)

    next(err)
  })

  app.use(function (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const status = err.status || 500
    let msg = 'Internal Server Error'
    
    if (status !== 500) {
      msg = err.message
    }

    // if (status === 404) {
    //   console.log(req.url)
    // }

    const errors = [{ message: msg }]
    
    res.status(status).json({ errors })
  })

  return app
}

export default App

