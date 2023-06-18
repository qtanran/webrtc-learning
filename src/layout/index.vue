<script setup>
import { ref } from 'vue'

const activeIndex = ref('user-media')
</script>

<template>
  <el-container>
    <el-aside width="200px">
      <el-menu :default-active="activeIndex" router>
        <el-menu-item index="/user-media">音视频采集</el-menu-item>
        <el-menu-item index="/video-recording">音视频录制</el-menu-item>
        <el-menu-item index="/chat-room">聊天室</el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.el-container {
  padding: 0;
  height: 100%;

  .el-menu {
    height: 100%;
  }
}
</style>
