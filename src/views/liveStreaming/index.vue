<script setup>
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'
const localVideo = ref('')
const remoteVideo = ref('')
// 是否分享桌面
const isShareDesk = ref(false)
const roomId = '111'

let localStream = null
let remoteStream = null

let pc = null
let dc = null

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
  createDataChannel()
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
  if (isShareDesk.value) {
    constraints.video = false
    await shareDesk()
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
  pc.ondatachannel = e => {
    if (!dc) {
      dc = e.channel
      dc.onmessage = receiveMsg
      dc.onopen = dataChannelStateChange
      dc.onclose = dataChannelStateChange
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

// 带宽
const bandwidth = ref('unlimited')
/**
 * 带宽发生改变
 */
const handleBandwidthChange = () => {
  // 获取到一组 RTCRtpSender 对象，用于接收数据，通常情况下，每一路音视频轨track都会对应有一个sender
  const senders = pc.getSenders()

  senders.forEach(sender => {
    if (sender?.track?.kind === 'video') {
      // 返回一个RTCRtpParameters对象，其中包含有关如何解码RTP数据的信息
      const parameters = sender.getParameters()
      if (!parameters.encodings) {
        parameters.encodings = [{}]
      }
      if (bandwidth.value === 'unlimited') {
        delete parameters.encodings[0].maxBitrate
      } else {
        parameters.encodings[0].maxBitrate = bandwidth.value * 1000
      }
      sender.setParameters(parameters)
    }
  })
}

// 聊天区域的文本
const historyContent = ref('')
// 要发送的文本
const sendText = ref('')
// 发送是否可用
const sendDisabled = ref(false)
/**
 * 发送
 */
const send = () => {
  if (!sendText.value) return
  dc.send(sendText.value)
  historyContent.value += '<-' + sendText.value + '\r\n'
  sendText.value = ''
}
const createDataChannel = () => {
  dc = pc.createDataChannel('chatchannel')
  dc.onmessage = receiveMsg
  dc.onopen = dataChannelStateChange
  dc.onclose = dataChannelStateChange
}
const receiveMsg = e => {
  if (e.data) {
    historyContent.value += '->' + e.data + '\r\n'
  }
}
const dataChannelStateChange = () => {
  const readyState = dc.readyState
  if (readyState === 'open') {
    sendDisabled.value = false
  } else {
    sendDisabled.value = true
  }
}
</script>

<template>
  <div>
    <el-button :disabled="!leaveBtnDisabled" @click="connectServer">连接</el-button>
    <el-button :disabled="leaveBtnDisabled" @click="leave">离开</el-button>
    <el-checkbox v-model="isShareDesk" size="large">共享桌面</el-checkbox>
    带宽 kb/s
    <el-select v-model="bandwidth" @change="handleBandwidthChange">
      <el-option label="无限制" value="unlimited" />
      <el-option label="2000" value="2000" />
      <el-option label="1000" value="1000" />
      <el-option label="500" value="500" />
      <el-option label="250" value="250" />
      <el-option label="125" value="125" />
    </el-select>
  </div>
  <div>
    <video ref="localVideo" autoplay playsinline muted></video>
    <video ref="remoteVideo" autoplay playsinline></video>
  </div>
  <el-form>
    <el-form-item>
      <el-input type="textarea" :rows="10" readonly resize="none" v-model="historyContent" />
    </el-form-item>
    <el-form-item>
      <el-input
        type="textarea"
        :rows="5"
        resize="none"
        v-model="sendText"
        :disabled="sendDisabled"
      />
    </el-form-item>
    <el-form-item>
      <el-button @click="send" :disabled="sendDisabled">发送</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.el-checkbox {
  margin-left: 20px;
}
video {
  width: 640px;
  height: 480px;
  background: #ccc;
  margin-right: 20px;
}
</style>
