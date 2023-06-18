<script setup>
import { ref, reactive, onMounted } from 'vue'

const videoData = reactive({
  width: 640, // 视频宽度
  height: 480, // 视频高度
  frameRate: 31, // 帧率
  deviceId: ''
})
const audioData = reactive({
  noiseSuppression: true, // 降噪
  echoCancellation: true, // 回音消除
  deviceId: ''
})

// video dom
const player = ref(null)
// 视频约束
const videoConstraints = ref({})
const getMediaStream = stream => {
  const videoTrack = stream.getVideoTracks()[0]
  videoConstraints.value = videoTrack.getSettings()
  player.value.srcObject = stream
}

/**
 * 音视频采集
 * @returns {Promise<void>}
 */
const getUserMedia = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: videoData,
    audio: audioData
  })
  getMediaStream(stream)
}

const devicesList = reactive({
  audioSource: [],
  audioOutput: [],
  videoSource: []
})
/**
 * 获取设别列表
 * @returns {Promise<void>}
 */
const getDevices = async () => {
  const list = await navigator.mediaDevices.enumerateDevices()
  list.forEach(item => {
    if (item.kind === 'audioinput') {
      devicesList.audioSource.push(item)
    } else if (item.kind === 'audiooutput') {
      devicesList.audioOutput.push(item)
    } else if (item.kind === 'videoinput') {
      devicesList.videoSource.push(item)
    }
  })
}

// 特效
const specialEffects = ref('none')

/**
 * 截图
 */
const picture = ref('')
const screenshot = () => {
  picture.value
    .getContext('2d')
    .drawImage(player.value, 0, 0, picture.value.width, picture.value.height)
}

onMounted(async () => {
  await getUserMedia()
  await getDevices()
  videoData.deviceId = devicesList.videoSource?.[0]?.deviceId
  audioData.deviceId = devicesList.audioSource?.[0]?.deviceId
})
</script>

<template>
  <div>
    <video autoplay playsinline ref="player" :class="specialEffects"></video>
    <canvas ref="picture" width="640" height="480"></canvas>
    <pre>{{ videoConstraints }}</pre>
    <el-form label-width="80px">
      <el-form-item label="帧率">
        <el-input-number v-model="videoData.frameRate" :min="1" :max="60" />
      </el-form-item>
      <el-form-item label="音频输入">
        <el-select v-model="audioData.deviceId">
          <el-option
            v-for="item in devicesList.audioSource"
            :label="item.label"
            :value="item.deviceId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="视频输入">
        <el-select v-model="videoData.deviceId">
          <el-option
            v-for="item in devicesList.videoSource"
            :label="item.label"
            :value="item.deviceId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="特效">
        <el-select v-model="specialEffects">
          <el-option label="无" value="none" />
          <el-option label="模糊" value="blur" />
          <el-option label="灰度" value="grayscale" />
          <el-option label="反色" value="invert" />
          <el-option label="褐色" value="sepia" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="getUserMedia">确定</el-button>
        <el-button @click="screenshot">截图</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.none {
  filter: none;
}
.blur {
  filter: blur(3px);
}
.grayscale {
  filter: grayscale(1);
}
.invert {
  filter: invert(1);
}
.sepia {
  filter: sepia(1);
}
</style>
