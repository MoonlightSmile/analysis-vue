<script setup lang="ts">
import { get } from 'lodash'
import * as echarts from 'echarts'
import req from '~/utils/request'
export interface Item {
  balance: number
  create_time: string
  expenditure: number
  id: number
  name: string
  pay_reason: string
  pay_type: string
}
interface IAnalysis {
  name: string
  balance_sum: number
}

const router = useRouter()
const svg = ref<HTMLDivElement>()
const svg1 = ref<HTMLDivElement>()
const chart = ref<echarts.ECharts>()
const chart1 = ref<echarts.ECharts>()
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
  analysis: {
    expenditure: 0,
    overage: 0,
    yue: '0',
    groupByName:
      [] as IAnalysis[],
  },
})
// const dataTotal = $computed(() => {
//   return state.list.reduce((acc, item) => {
//     if (acc[item.name])
//       acc[item.name] += Number(item.balance)
//     else
//       acc[item.name] = Number(item.balance)

//     return acc
//   }, {} as Record<string, number>)
// })
// const c = $computed(() => Object.entries(dataTotal).filter(([name]) => Boolean(name)).sort(([_, v1], [__, v2]) => v2 - v1))
// const m = $computed(() => state.list.reduce((acc, item) => {
//   const time = dayjs(item.createTime).format('YYYY-MM-DD')
//   if (acc[time])
//     acc[time].push(item)

//   else
//     acc[time] = [item]

//   return acc
// }, {} as Record<string, any[]>))
// const max = $computed(() => Math.max(...Object.entries(m).map(([, v]) => v.length)))
// const value = $computed(() => Object.entries(m).filter(([_, items]) => items.length === max))
// const maxWithDate = $computed(() => Object.entries(m).reduce((acc, item) => {
//   const time = dayjs(item[0]).format('YYYY-MM-DD')

//   acc[time] = item[1].reduce((a, i) => a += i.balance, 0)

//   return acc
// }, {} as Record<string, number>))
// const maxDateV = $computed(() => Object.entries(maxWithDate).sort(([_, v1], [__, v2]) => v2 - v1))
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
          color: '#52A8FF',
          normal: {
            borderRadius: [8, 8, 8, 8],
            color(params: any) {
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
        data: state.analysis.groupByName.map(e => e.balance_sum),

      },
    ],
  })
})

const onBarClick = (e: any) => {
  router.push(`/${e.name}`)
}
onMounted(() => {
  if (svg.value)
    chart.value = echarts.init(svg.value)
  if (svg1.value)
    chart1.value = echarts.init(svg1.value)
  chart.value?.on('click', onBarClick)
})
onBeforeMount(() => {
  chart.value?.off('click', onBarClick)
  req.get<{ data: any[] }>('/list', {
    params: {
      pageSize: 999,
    },
  }).then((e) => {
    state.list = e.data.data
  })
  req.get('/analysis').then((e) => {
    state.analysis = e.data
  })
})
</script>

<template>
  <div class="h-full">
    <h1 class="text-center mt-1 bg-gray-100 !mt-0 text-2xl pt-4 pb-2">
      2022 基金分析
    </h1>
    <div class="mb-2 px-5 bg-gray-100 text-gray-500 pb-2">
      当前余额:
      <div class="flex items-end">
        <h1 class="text-red mx-1 text-2xl font-medium">
          {{ Number(state.analysis.yue).toFixed(2) }}
        </h1>
        <div class="mb-0.9">
          元
        </div>
      </div>
    </div>
    <div ref="svg" class="w-full h-160" />

    <div class="px-2 text-sm pb-4">
      <!-- <div ref="svg1" class="h-42 w-50 float-right" /> -->

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
