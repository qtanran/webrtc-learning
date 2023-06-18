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
      }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
