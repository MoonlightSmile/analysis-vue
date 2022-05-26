<script lang="ts" setup>
import { darkTheme } from 'naive-ui'
import { isDark } from '~/composables'
const TabConfig = [
  {
    path: '/',
    name: '主页',
  },
  {
    path: '/analysis',
    name: '分析',
  },
  {
    path: '/setting',
    name: '设置',
  },
]
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <main h-screen font-sans flex flex-col text="gray-700 dark:gray-200">
      <!-- <div flex flex-1 flex-col> -->
      <router-view />
    <!-- </div> -->

    <!-- <nav flex justify-around b-t-1>
        <router-link
          v-for="r in TabConfig"
          :key="r.path"
          :to="r.path"
          active-class="text-red"
          class="flex flex-1 p-2 justify-center"
        >
          {{ r.name }}
        </router-link>
      </nav> -->

    <!-- <Footer /> -->
    </main>
  </n-config-provider>
</template>
