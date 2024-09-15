import http from "http"
import { Server } from "socket.io"
import Room from "../models/room"


export function deploySockets(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    })
    
    io.on('connection', (socket) => {
        socket.on('post-message', async ({ roomId }) => {
            const room = await Room
                .findById(roomId)
                .lean()
                .populate('messages')
                .exec()

            io.to(roomId).emit('room-update', { room })
        })

        socket.on('join-room', async ({ roomId, update }) => {
            socket.join(roomId)

            if (update) {
                const room = await Room
                    .findById(roomId)
                    .lean()
                    .populate('messages')
                    .exec()
                
                io.to(roomId).emit('room-update', { room })
            }
        })

        socket.on('leave-room', async ({ roomId, update }) => {
            if (update) {
                const room = await Room
                    .findById(roomId)
                    .lean()
                    .populate('messages')
                    .exec()

                io.to(roomId).emit('room-update', { room })
            }

            socket.leave(roomId)
        })
    })
}