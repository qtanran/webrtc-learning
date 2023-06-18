<script setup>
import { ref, reactive } from 'vue'
import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'

const connectBtnDisabled = ref(false)
const leaveBtnDisabled = ref(true)
const sendBtnDisabled = ref(true)

const formData = reactive({
  username: '',
  room: '',
  content: '',
  input: ''
})

const socket = io('ws://localhost:3000')

socket.on('joined', (room, id) => {
  connectBtnDisabled.value = true
  leaveBtnDisabled.value = false
  sendBtnDisabled.value = false
  ElMessage.success('加入房间成功！')
})

socket.on('leaved', (room, id) => {
  connectBtnDisabled.value = false
  leaveBtnDisabled.value = true
  sendBtnDisabled.value = true
  ElMessage.success('离开房间成功！')
})

socket.on('message', (room, id, data) => {
  formData.content = formData.content + data + '\r'
})

const connect = () => {
  if (!formData.room || !formData.username) {
    ElMessage.error('用户名和房间名不能为空！')
    return
  }
  socket.emit('join', formData.room)
}
const leave = () => {
  socket.emit('leave', formData.room)
}
const send = () => {
  formData.content = formData.content + formData.username + ': ' + formData.input + '\r'
  socket.emit('message', formData.room, formData.username + ': ' + formData.input)
  formData.input = ''
}
</script>

<template>
  <el-form label-width="100px">
    <el-form-item label="用户名">
      <el-input v-model="formData.username" />
    </el-form-item>
    <el-form-item label="房间名">
      <el-input v-model="formData.room" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="connect" :disabled="connectBtnDisabled">连接</el-button>
      <el-button type="danger" @click="leave" :disabled="leaveBtnDisabled">断开连接</el-button>
    </el-form-item>
    <el-form-item label="聊天区">
      <el-input v-model="formData.content" type="textarea" rows="10" readonly resize="none" />
    </el-form-item>
    <el-form-item label="输入区">
      <el-input v-model="formData.input" type="textarea" rows="3" resize="none" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="send" :disabled="sendBtnDisabled">发送</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
