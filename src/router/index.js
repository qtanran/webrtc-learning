import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'user-media',
        component: () => import('@/views/userMedia/index.vue')
      },
      {
        path: 'video-recording',
        component: () => import('@/views/videoRecording/index.vue')
      },
      {
        path: 'chat-room',
        component: () => import('@/views/chatRoom/index.vue')
      },
      {
        path: 'local-interflow',
        component: () => import('@/views/localInterflow/index.vue')
      },
      {
        path: 'live-streaming',
        component: () => import('@/views/liveStreaming/index.vue')
      }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
