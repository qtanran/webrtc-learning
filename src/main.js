import { createApp } from 'vue'
import './style.css'
import router from './router'
import App from './App.vue'
import 'element-plus/theme-chalk/el-message.css'

createApp(App).use(router).mount('#app')
