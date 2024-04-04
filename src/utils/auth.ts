import dotenv from 'dotenv'
dotenv.config()
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from "express"
import { UserType } from '../types/model'


export function generateAuthToken(
  user: UserType, hoursToLive=24
): string {
    if (process.env.NODE_ENV === 'production') {
        return jwt.sign(
            user, 
            process.env.TOKEN_SECRET as string,
            { expiresIn: hoursToLive + 'h' }
          )
    }

    return jwt.sign(
        user, 
        process.env.TOKEN_SECRET as string,
      )
}

export function authenticateToken(
    req: Request, 
    res: Response, 
    next: NextFunction
) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
  
    if (token == null) {
        const err = new Error('Json web token could not be authenticated')
        err.status = 401

        return next(err)
    }
  
    jwt.verify(
        token, 
        process.env.TOKEN_SECRET as string, 
        (err: any, user: any) => {
            const errMsgTrunk = 'Request could not be authorized'

            if (err) {
                const err = new Error(errMsgTrunk)
                err.status = 403

                return next(err)
            }

            const room = req.documents.roomId

            if (room.deleted_users.includes(user.username)) {
                const err = new Error(
                    `${errMsgTrunk}; user was deleted from room`
                )
                err.status = 403

                return next(err)
            }

            if (
                room._id.toString() !== user.roomId.toString()
                || !room.users.includes(user.username)
            ) {
                const err = new Error(
                    `${errMsgTrunk}; user not in requested room`
                )
                err.status = 403

                return next(err)
            }

            req.user = user
        
            next()
        })
}