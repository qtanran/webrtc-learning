<script setup>
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'
const localVideo = ref('')
const remoteVideo = ref('')
const roomId = '111'

let localStream = null
let remoteStream = null

let pc = null

let state = 'init'
// 按钮禁用
const leaveBtnDisabled = ref(true)

const pcConfig = {
  iceServers: [
    {
      urls: 'stun:123.57.89.98:3478',
      credential: 'qtanran',
      username: '111111'
    }
  ]
}

const socket = io('ws://localhost:3000')

socket.on('joined', (roomId, id) => {
  state = 'joined'
  createPeerConnection()
  bindTracks()
  leaveBtnDisabled.value = false
  console.log('加入房间', { roomId, id, state })
})

socket.on('otherJoin', async roomId => {
  if (state === 'joined_unbind') {
    createPeerConnection()
    bindTracks()
  }
  state = 'joined_conn'
  await call()
  console.log('其他用户加入房间', { roomId, state })
})

socket.on('full', (roomId, id) => {
  hangup()
  closeLocalMedia()
  state = 'leaved'
  ElMessage.error('房间已满！')
  console.log('收到房间已满的消息', roomId, id)
})

socket.on('leaved', (roomId, id) => {
  state = 'leaved'
  socket.disconnect()
  leaveBtnDisabled.value = true
  console.log('断开', { roomId, id })
})

socket.on('bye', (roomId, id) => {
  state = 'joined_unbind'
  hangup()
  console.log('其他用户离开房间', { roomId, id })
})

socket.on('message', async (roomId, id, data) => {
  console.log('收到消息', { roomId, id, data })
  if (!data) return

  if (data?.type === 'offer') {
    await pc.setRemoteDescription(new RTCSessionDescription(data))
    const desc = await pc.createAnswer()
    await pc.setLocalDescription(desc)
    socket.emit('message', roomId, desc)
  } else if (data?.type === 'answer') {
    await pc.setRemoteDescription(new RTCSessionDescription(data))
  } else if (data?.type === 'candidate') {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: data.label,
      candidate: data.candidate
    })
    console.log(candidate, pc)
    await pc.addIceCandidate(candidate)
  } else {
    console.log('无效的消息', data)
  }
})

/**
 * 分享桌面
 */
const shareDesk = async () => {
  localStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
}

/**
 * 调用摄像头，获取视频流
 */
const getUserMedia = async () => {
  const constraints = {
    video: true,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
  return await navigator.mediaDevices.getUserMedia(constraints)
}

/**
 * 渲染媒体流
 */
const renderMedia = stream => {
  if (localStream) {
    stream.getAudioTracks().forEach(track => {
      localStream.addTrack(track)
      stream.removeTrack(track)
    })
  } else {
    localStream = stream
  }

  localVideo.value.srcObject = localStream
}

/**
 * 创建对等连接
 */
const createPeerConnection = () => {
  if (pc) return
  pc = new RTCPeerConnection(pcConfig)
  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('message', roomId, {
        type: 'candidate',
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate
      })
    }
  }
  pc.ontrack = e => {
    remoteStream = e.streams[0]
    remoteVideo.value.srcObject = e.streams[0]
  }
}

const bindTracks = () => {
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream)
  })
}

const call = async () => {
  const desc = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  })
  await pc.setLocalDescription(desc)
  socket.emit('message', roomId, desc)
}

/**
 * 销毁对等连接
 */
const hangup = () => {
  if (pc) {
    pc.close()
    pc = null
  }
}

/**
 * 关闭本地媒体流
 */
const closeLocalMedia = () => {
  if (localStream?.getTracks()) {
    localStream.getTracks().forEach(track => {
      track.stop()
    })
  }
  localStream = null
}

/**
 * 连接服务器
 */
const connectServer = async () => {
  const stream = await getUserMedia()
  renderMedia(stream)
  socket.emit('join', roomId)
}

/**
 * 离开
 */
const leave = () => {
  if (socket) {
    socket.emit('leave', roomId)
  }
  hangup()
  closeLocalMedia()
  leaveBtnDisabled.value = true
}
</script>

<template>
  <div>
    <el-button :disabled="!leaveBtnDisabled" @click="connectServer">连接</el-button>
    <el-button :disabled="leaveBtnDisabled" @click="leave">离开</el-button>
  </div>
  <video ref="localVideo" autoplay playsinline muted></video>
  <video ref="remoteVideo" autoplay playsinline></video>
</template>

<style scoped lang="scss"></style>
