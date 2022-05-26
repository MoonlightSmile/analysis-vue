<script setup lang="ts">
import Decimal from 'decimal.js'

import dayjs from 'dayjs'
import { first, get } from 'lodash'
import * as echarts from 'echarts'
import req from '~/utils/request'

const svg = ref<HTMLDivElement>()
const svg1 = ref<HTMLDivElement>()
const state = reactive({
  list: [] as
    {
      balance: number
      createTime: string
      expenditure: number
      id: number
      name: string
      payReason: string
      payType: string
    }[],
  total: {
    balance: 0,
    expenditure: 0,
  },
})
const dataTotal = $computed(() => {
  return state.list.reduce((acc, item) => {
    if (acc[item.name])
      acc[item.name] += Number(item.balance)
    else
      acc[item.name] = Number(item.balance)

    return acc
  }, {} as Record<string, number>)
})
const c = $computed(() => Object.entries(dataTotal).sort(([_, v1], [__, v2]) => v2 - v1))
const m = $computed(() => state.list.reduce((acc, item) => {
  const time = dayjs(item.createTime).format('YYYY-MM-DD')
  if (acc[time])
    acc[time].push(item)

  else
    acc[time] = [item]

  return acc
}, {} as Record<string, any[]>))
const max = $computed(() => Math.max(...Object.entries(m).map(([, v]) => v.length)))
const value = $computed(() => Object.entries(m).filter(([_, items]) => items.length === max))
const maxWithDate = $computed(() => Object.entries(m).reduce((acc, item) => {
  const time = dayjs(item[0]).format('YYYY-MM-DD')

  acc[time] = item[1].reduce((a, i) => a += i.balance, 0)

  return acc
}, {} as Record<string, number>))
const maxDateV = $computed(() => Object.entries(maxWithDate).sort(([_, v1], [__, v2]) => v2 - v1))
watchEffect(() => {
  if (!svg.value)
    return
  const e = echarts.init(svg.value)
  e.setOption({
    grid: {
      top: 8,
    },
    xAxis: {
      type: 'category',

      axisLabel: { interval: 0, rotate: 300 },

      data: c.map(e => e[0]),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: c.map(e => e[1]),
        type: 'bar',
        showBackground: true,
        label: {
          show: true,
          position: 'top',
        },

      },
    ],
  })
})

watchEffect(() => {
  if (!svg1.value)
    return
  const e = echarts.init(svg1.value)
  e.setOption({
    visualMap: {
      min: 0,
      max: 150,
      type: 'continuous',
      orient: 'horizontal',
      left: 'center',
      top: 0,
    },
    tooltip: { show: true },
    calendar: {
      top: 60,
      left: 20,
      right: 10,
      range: '2022',
      itemStyle: {
        borderWidth: 0.1,
      },
      yearLabel: { show: true },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: Object.entries(maxWithDate).filter(([, v]) => v > 0),
    },
  })
})
const yue = $computed(() => {
  return new Decimal(state.total.balance).sub(state.total.expenditure).toString()
})
onBeforeMount(() => {
  req.get('/list').then((e) => {
    state.list = e.data
  })
  req.get('/total').then((e) => {
    state.total = e.data
  })
})
</script>

<template>
  <div class="h-full w-full ">
    <h1 class="text-center mt-1">
      2022 基金分析
    </h1>
    <div ref="svg" class="w-full h-1/2" />
    <div ref="svg1" class="w-full h-60" />
    <div class="px-2 text-sm">
      <div class="mb-2">
        当前余额:
        <h1 class="text-red mx-1 text-xl">
          {{ yue }}元
        </h1>
      </div>
      <div>
        <span class="text-blue mx-1">{{ value.map((e) => e[0]).join(",") }}</span>共有「<span class="text-red">{{ max
        }}</span>」人捐助了基金。生活真是苦涩又不乏趣味呢！
      </div>
      <div>
        <span class="text-blue mx-1">{{ first(first(maxDateV)) }}</span>这一天我们的基金收益最多, 一共收入<span class="text-red mx-1">{{

          get(maxDateV, "[0][1]")

        }}</span>元
      </div>
      <div>
        今年我们一共收到<span class="text-blue mx-1">{{ state.total.balance }}</span>元的基金。
      </div>
      <div>
        今年为零食买单一共
        <span class="text-blue mx-1">{{ state.total.expenditure }}</span> 元, 有没有让我们长胖几斤呢。
      </div>
    </div>
  </div>
</template>
