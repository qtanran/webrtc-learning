<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const player = ref(null)
const recPlayer = ref(null)
const buffer = []
let mediaRecorder = null
let stream = null

const btnDisabled = ref(true)
// 录制的类型
const recordType = ref(true)

/**
 * 开始录制
 */
const startRecord = () => {
  buffer.length = 0
  const options = {
    mimeType: 'video/webm;codecs=vp8'
  }

  // 检查录制支持的文件格式
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    ElMessage.error(`${options.mimeType} is not supported!`)
    return
  }

  try {
    /**
     * stream：音视频媒体流
     * options：限制选项
     */
    mediaRecorder = new MediaRecorder(stream, options)
  } catch (e) {
    ElMessage.error('Failed to create MediaRecorder:', e)
    return
  }

  // 开始录制，timeslice是可选的，如果设置了会按照时间切片存储数据
  mediaRecorder.start(10)

  // 每次数据有效时会触发该事件
  // 与timeslice相关，如果没有指定时间片，则记录整个数据
  // 该事件会传递一个event, 其中的data属性包含真正录制的音视频数据，可以在获取到该数据后进行存储操作
  mediaRecorder.ondataavailable = e => {
    if (e?.data?.size > 0) {
      buffer.push(e.data)
    }
  }

  btnDisabled.value = true

  ElMessage.success('已开始录制')
}

/**
 * 结束录制
 */
const stopRecord = () => {
  mediaRecorder.stop()
  btnDisabled.value = false
  ElMessage.success('已停止录制')
}

/**
 * 播放
 */
const play = () => {
  const blob = new Blob(buffer, { type: 'video/webm' })
  recPlayer.value.src = window.URL.createObjectURL(blob)
  recPlayer.value.srcObject = null
  recPlayer.value.play()
}

/**
 * 下载
 */
const download = () => {
  const blob = new Blob(buffer, { type: 'video/webm' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.style.display = 'none'
  a.download = Date.now() + '.webm'
  a.click()
}

/**
 * 打开摄像头获取媒体流
 * @returns {Promise<void>}
 */
const getUserMedia = async () => {
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640
    },
    audio: true
  })
  player.value.srcObject = videoStream
  stream = videoStream
}

/**
 * 打开屏幕共享获取媒体流
 * @returns {Promise<void>}
 */
const getDisplayMedia = async () => {
  const videoStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: 640
    },
    audio: true
  })
  player.value.srcObject = videoStream
  stream = videoStream
}

/**
 * 监听开关的改变
 */
const switchChange = val => {
  val ? getUserMedia() : getDisplayMedia()
}

onMounted(async () => {
  await getUserMedia()
})
</script>

<template>
  <video autoplay playsinline ref="player"></video>
  <video playsinline controls ref="recPlayer"></video>
  <div>
    <el-switch
      v-model="recordType"
      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #409eff; margin-right: 15px"
      inline-prompt
      width="100"
      size="large"
      active-text="摄像头录制"
      inactive-text="屏幕录制"
      @change="switchChange"
    />
    <el-button @click="startRecord" type="primary">开始录制</el-button>
    <el-button @click="stopRecord" type="danger" :disabled="!btnDisabled">停止录制</el-button>
    <el-button @click="play" :disabled="btnDisabled">播放</el-button>
    <el-button @click="download" :disabled="btnDisabled">下载</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
