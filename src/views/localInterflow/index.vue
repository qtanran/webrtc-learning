<script setup>
import { ref } from 'vue'
const localVideo = ref('')
const remoteVideo = ref('')
const localSdp = ref('')
const remoteSdp = ref('')

let localStream
let pc1
let pc2

const getMediaStream = stream => {
  localVideo.value.srcObject = stream
  localStream = stream
}

const getLocalDescription = async desc => {
  // 设置本地 SDP 描述信息
  await pc1.setLocalDescription(desc)
  // 设置远端 SDP 描述信息，即对方发过来的 SDP 数据
  await pc2.setRemoteDescription(desc)
  localSdp.value = desc.sdp
}

const getAnswerDescription = async desc => {
  await pc2.setLocalDescription(desc)
  await pc1.setRemoteDescription(desc)
  remoteSdp.value = desc.sdp
}

const start = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })
  getMediaStream(stream)
}

const call = async () => {
  pc1 = new RTCPeerConnection()
  pc2 = new RTCPeerConnection()

  // 收到候选者时触发
  pc1.onicecandidate = e => {
    // 添加一个 ICE 代理
    pc2.addIceCandidate(e.candidate)
  }

  pc2.onicecandidate = e => {
    pc1.addIceCandidate(e.candidate)
  }

  pc2.ontrack = e => {
    remoteVideo.value.srcObject = e.streams[0]
  }

  // 将音视频流添加到 RTCPeerConnection 对象中
  localStream.getTracks().forEach(track => {
    pc1.addTrack(track, localStream)
  })

  // 创建提议 Offer 方法，此方法会返回 SDP Offer 信息
  const desc = await pc1.createOffer({
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1
  })

  await getLocalDescription(desc)

  // 创建应答 Answer 方法，此方法会返回 SDP Answer 信息
  const answerDesc = await pc2.createAnswer()

  await getAnswerDescription(answerDesc)
}

const hangUp = () => {
  pc1.close()
  pc2.close()
}
</script>

<template>
  <div>
    <el-button @click="start">开始</el-button>
    <el-button @click="call">呼叫</el-button>
    <el-button @click="hangUp">挂断</el-button>
  </div>
  <el-row :gutter="20">
    <el-col :span="12">
      <video ref="localVideo" autoplay playsinline></video>
    </el-col>
    <el-col :span="12">
      <video ref="remoteVideo" autoplay playsinline></video>
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="12">
      <el-input type="textarea" v-model="localSdp" :rows="15" readonly resize="none" />
    </el-col>
    <el-col :span="12">
      <el-input type="textarea" v-model="remoteSdp" :rows="15" readonly resize="none" />
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
video {
  background: #222;
  height: 380px;
}
</style>
