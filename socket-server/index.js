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

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

io.on('connection', socket => {
  console.log('a user connected')

  socket.on('message', (room, data) => {
    console.log('发送消息', room, data)
    // 房间内除自己外所有人
    socket.to(room).emit('message', room, socket.id, data)
  })

  socket.on('join', room => {
    socket.join(room)
    socket.emit('joined', room, socket.id)
    console.log('用户加入房间', room, socket.id)
  })

  socket.on('leave', room => {
    socket.leave(room)
    socket.emit('leaved', room, socket.id)
    console.log('用户离开房间', room, socket.id)
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
