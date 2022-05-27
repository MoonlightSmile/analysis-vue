<script setup lang="ts">
import Decimal from 'decimal.js'

import dayjs from 'dayjs'
import { first, get, last } from 'lodash'
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
    grid: { left: 20, top: 20, bottom: 20, right: 30, containLabel: true },

    xAxis: {
      type: 'value',
      boundaryGap: false,
      max: 600,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      label: {
        show: false,
        position: 'top',
      },
    },
    yAxis: {
      inverse: true,
      data: c.map(e => e[0]),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },

      axisLabel: {
        padding: [0, 0, 20, -10],
        inside: true,
        textStyle: {
          fontSize: 14,
          align: 'left',
        },
        formatter: '{value}\n{a|占位}',
        rich: {
          a: {
            color: 'transparent',
            lineHeight: 30,
            fontFamily: 'digital',
            fontSize: 14,
          },
        },
      },

    },
    dataZoom: [],
    series: [
      {
        type: 'bar',
        showBackground: true,
        backgroundStyle: { color: 'transparent', borderRadius: [0, 8, 8, 0] },
        itemStyle: {
          color: '#52A8FF',
          normal: {
            borderRadius: [8, 8, 8, 8],
            color(params) {
              // 定义一个颜色集合
              const colorList = [
                '#52A8FF',
                '#00B389',
                '#FFA940',
                '#FF5A57',
                '#29EFC4',
                '#F8AEA4',
                '#FFC53D',
                '#009982',
                '#C099FC',
                '#F5855F',
                '#F5855F',
                '#F5855F',
                '#F5855F',
                '#F5855F',
              ]
              // 对每个bar显示一种颜色
              return colorList[params.dataIndex]
            },
          },
        },
        barMaxWidth: 16,
        label: {
          show: true,
          position: 'right',
        },
        data: c.map(e => e[1]),

      },
    ],
  })
})

watchEffect(() => {
  if (!svg1.value)
    return

  const now = dayjs()
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
    tooltip: {
      show: true,
      formatter(params) {
        return get(m, `[${[first(params.value)!]}]`, []).map((e) => {
          return `<span style="display:inline-flex;width: 50px;text-align:right;">${e.name}</span>: ${e.balance}`
        }).join('<br/>')
      },

    },
    calendar: {
      orient: 'vertical',
      top: 60,
      left: 'center',
      // range: [`${now.format('YYYY')}-01`, now.add(1, 'M').format('YYYY-MM')],
      range: now.format('YYYY-MM'),
      cellSize: 20,
      itemStyle: {
        borderWidth: 0.1,
      },
      yearLabel: { show: false },
      splitLine: {
        show: false,
        lineStyle: {
          color: '#204371',
          type: 'solid',
        },
      },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: Object.entries(maxWithDate).filter(([, v]) => v > 0),
      label: {
        show: true,
        formatter(params) {
          return last(params.value)
        },
        color: '#fff',
        fontSize: 8,

      },
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
  <div class="h-full">
    <h1 class="text-center mt-1">
      2022 基金分析
    </h1>
    <div ref="svg" class="w-full h-150" />

    <div class="px-2 text-sm">
      <div ref="svg1" class="h-50 w-50 float-right" />
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
