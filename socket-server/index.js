const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

// 连接
io.on('connection', socket => {
  console.log('a user connected')

  // 发送消息
  socket.on('message', (room, data) => {
    console.log('发送消息', room, data)
    // 房间内除自己外所有人
    socket.to(room).emit('message', room, socket.id, data)
  })

  // 加入房间
  socket.on('join', room => {
    socket.join(room)
    console.log('用户加入房间', room, socket.id)
    // 获取我的房间
    const myRoom = io.sockets.adapter.rooms.get(room)
    const userNum = myRoom ? myRoom.size : 0
    console.log('用户数', userNum)
    if (userNum < 3) {
      // 给自己发送 joined
      socket.emit('joined', room, socket.id)
      if (userNum > 1) {
        // 给房间里的其他用户发送 otherJoin
        socket.to(room).emit('otherJoin', room, socket.id)
      }
    } else {
      // 如果房间人数大于等于3人
      socket.leave(room)
      // 给自己发送 full
      socket.emit('full', room, socket.id)
    }
  })

  // 离开房间
  socket.on('leave', room => {
    socket.leave(room)
    // 给房间里的其他用户发送 bye
    socket.to(room).emit('bye', room, socket.id)
    // 给自己发送 leaved
    socket.emit('leaved', room, socket.id)
    console.log('用户离开房间', room, socket.id)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
