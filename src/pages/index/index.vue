<script setup lang="ts">
import { first, get, groupBy, last } from 'lodash'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import 'dayjs/locale/zh-cn.js'
import req from '~/utils/request'
export interface Item {
  balance: number
  create_time: string
  expenditure: number
  id: number
  name: string
  pay_reason: string
  pay_type: string
} // ES 2015
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
const enum EPicker {
  'week' = 'week',
  'month' = 'month',
  'year' = 'year',
  'all' = 'all',
}
type TPicker = keyof typeof EPicker

interface IAnalysis {
  name: string
  balance_sum: number
}

const pickerMap = {
  week: '本周',
  month: '本月',
  year: '本年',
  all: '累计',
}
const now = dayjs()
const router = useRouter()
const svg = ref<HTMLDivElement>()
const svg1 = ref<HTMLDivElement>()
const chart = ref<echarts.ECharts>()
const chart1 = ref<echarts.ECharts>()
const state = reactive({
  list: [] as Item[],
  analysis: {
    expenditure: 0,
    overage: 0,
    yue: '0',
    groupByName:
      [] as IAnalysis[],
  },
  timePicker: EPicker.all as EPicker,
  names: [] as string[],
})
const groupByTime = $computed(() => {
  return groupBy(state.list.map(e => ({ ...e, create_time: dayjs(e.create_time).format('YYYY-MM-DD') })), 'create_time')
})
const lastByItem = $computed(() => {
  const a = state.list.filter(e => e.expenditure > 0).sort((a, b) => dayjs(a.create_time).isBefore(dayjs(b.create_time)) ? 1 : -1)
  return first(a)
})

const timePickerPatams = $computed(() => {
  switch (state.timePicker) {
    case 'month':
      return {
        startTime: now.startOf('month').format('YYYY-MM-DD'),
        endTime: now.add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      }
    case 'year':
      return {
        startTime: now.startOf('year').format('YYYY-MM-DD'),
        endTime: now.add(1, 'year').startOf('year').format('YYYY-MM-DD'),
      }
    case 'week':
      return {
        startTime: now.startOf('week').format('YYYY-MM-DD'),
        endTime: now.endOf('week').format('YYYY-MM-DD'),
      }
    default:
      return {
        startTime: '2022-01-01',
        endTime: now.add(1, 'year').startOf('year').format('YYYY-MM-DD'),
      }
  }
})

watch(() => state.analysis.groupByName, () => {
  if (!chart.value)
    return

  chart.value.setOption({
    grid: { left: 20, top: 20, bottom: 0, right: 30, containLabel: true },

    xAxis: {
      type: 'value',
      boundaryGap: false,
      max: (Math.ceil(get(state.analysis.groupByName, '[0].balance_sum', 0) / 10) * 10) + 100,
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
      data: state.analysis.groupByName.map(e => e.name),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },

      axisLabel: {
        padding: [0, 0, 10, -5],
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
        backgroundStyle: { color: '#ededed', borderRadius: [8, 8, 8, 8] },
        itemStyle: {
          color: '#845EC2',
          normal: {
            borderRadius: [8, 8, 8, 8],
            color: '#845EC2',
          },
        },
        barMaxWidth: 16,
        label: {
          show: true,
          position: 'right',
        },
        data: state.analysis.groupByName.map(e => e.balance_sum),

      },
    ],
  })
})

watch(() => state.list, () => {
  if (!chart1.value)
    return
  chart1.value.setOption({
    visualMap: {
      min: 0,
      max: 150,
      type: 'continuous',
      orient: 'horizontal',
      left: 'center',
      top: 0,
      inRange: {
        color: ['#D5CCE3', '#845EC2'], // From smaller to bigger value ->
      },
    },
    tooltip: {
      show: true,
      formatter(params: any) {
        const _groupByName = Object
          .entries(groupBy(groupByTime[params.data?.[0]], 'name'))
          .reduce((acc, [name, items]) => {
            const v = items.reduce((acc, b) => { acc += b?.balance ?? 0; return acc }, 0)
            if (v > 0)
              acc.push({ name, value: v })
            return acc
          }, [] as { name: string; value: number }[])
          .sort((a, b) => b.value - a.value)

        return `<div>
        <div style="margin-bottom: 8px;color: #845EC2;">${params.data?.[0]}</div>
        ${_groupByName.map(e => `<div style="display:flex;">${`<div style="width: 50px;text-align: left;">${e.name}</div>: ${e.value}`}</div>`).join('')}</div>`
      },
    },
    calendar: {
      orient: 'vertical',
      top: 60,
      left: 30,
      bottom: 10,
      right: 10,
      range: now.format('YYYY-MM'),
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
      data: Object.entries(groupByTime).map(([time, items]) => {
        return [time, items.reduce((a, b) => { a += b.balance ?? 0; return a }, 0)]
      }),
      label: {
        show: true,
        formatter(params: any) {
          return last(params.value)
        },
        color: '#fff',
        fontSize: 8,

      },
    },
  })
})

const onBarClick = (e: any) => {
  router.push(`/user/${e.name}`)
}
onMounted(() => {
  if (svg.value)
    chart.value = echarts.init(svg.value)
  if (svg1.value)
    chart1.value = echarts.init(svg1.value)
  chart.value?.on('click', onBarClick)
})
onBeforeMount(() => {
  req.get<{ data: any[] }>('/list', {
    params: {
      pageSize: 999,
      startTime: now.startOf('month').format('YYYY-MM-DD'),
      endTime: now.add(1, 'month').startOf('month').format('YYYY-MM-DD'),
    },
  }).then((e) => {
    state.list = e.data.data
  })
  req.get('/analysis', { params: timePickerPatams }).then((e) => {
    state.analysis = e.data
    state.names = e.data.groupByName.map((e: any) => e.name)
  })
})

watchEffect(() => {
  req.get('/analysis', {
    params: timePickerPatams,
  }).then((res) => {
    state.analysis.groupByName = state.names.map((e) => {
      const item = (res.data.groupByName ?? []).find((e1: any) => e1.name === e)
      return item || {
        name: e,
        balance_sum: 0,
      }
    }).sort((a, b) => b.balance_sum - a.balance_sum)
  })
})
onBeforeUnmount(() => {
  chart.value?.off('click', onBarClick)
  chart.value?.dispose()
})
const onPickerClick = (p: TPicker) => {
  state.timePicker = p
}
</script>

<template>
  <div class="h-full relative">
    <div class="top-0 w-full">
      <h1 class="text-center mt-1 bg-gray-100 !mt-0 text-2xl pt-4 pb-2">
        2022 - {{ now.year() }} 基金分析
      </h1>
      <div class="mb-2 px-5 bg-gray-100 text-gray-500 pb-2 flex justify-between items-end">
        <div>
          <div class="text-xs">
            当前余额(元)
          </div>
          <div class="flex items-end">
            <h1 class="text-red mx-1 text-2xl font-medium">
              {{ Number(state.analysis.yue).toFixed(2) }}
            </h1>
          </div>
        </div>
        <div v-if="lastByItem" class="text-xs flex-col items-center h-full justify-between mb-1">
          <div>
            最近消费<span class="px-1 text-#FFA940">{{ dayjs(lastByItem.create_time).fromNow() }}</span>
          </div>

          <div>
            for <span class="text-blue">{{ lastByItem.pay_reason }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-around">
      <div
        v-for="(v, k) in pickerMap" :key="k" :class="state.timePicker === k && 'text-#845EC2'"
        @click="onPickerClick(k)"
      >
        {{ v }}
      </div>
    </div>
    <div ref="svg" class="w-full h-220" />

    <div class="px-2 text-sm pb-4">
      <div ref="svg1" class="h-50 w-full " />

      <!-- <div>
        <span class="text-blue mx-1">{{ value.map((e) => e[0]).join(",") }}</span>共有「<span class="text-red">{{ max
        }}</span>」人捐助了基金。生活真是苦涩又不乏趣味呢！
      </div> -->
      <!-- <div>
        <span class="text-blue mx-1">{{ first(first(maxDateV)) }}</span>这一天我们的基金收益最多, 一共收入<span class="text-red mx-1">{{

          get(maxDateV, "[0][1]")

        }}</span>元
      </div> -->
      <div>
        我们一共收到<span class="text-blue mx-1">{{ state.analysis.overage.toFixed(2) }}</span>元的基金。
      </div>
      <div>
        为零食买单一共
        <span class="text-blue mx-1">{{ state.analysis.expenditure.toFixed(2) }}</span> 元, 有没有让我们长胖几斤呢。
      </div>
    </div>
  </div>
</template>
