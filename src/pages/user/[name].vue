<script setup lang="ts">
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { groupBy, last } from 'lodash'
import type { Item } from './index.vue'
import req from '~/utils/request'

const { params: { name } } = useRoute()
const svg = ref<HTMLDivElement>()
const charts = ref<echarts.ECharts>()
const state = reactive({
  list: [] as Item[],
})
onBeforeMount(() => {
  req.get<{ data: any[] }>('/list', {
    params: {
      name,
      pageSize: 999,
    },
  }).then((res) => {
    const list = res.data.data.map(e => ({ ...e, create_time: dayjs(e.create_time).format('YYYY-MM-DD') }))
    state.list = Object.entries(groupBy(list, 'create_time')).reduce((acc, [k, v]) => {
      acc.push([k, v.reduce((acc, item) => { acc += item.balance ?? 0; return acc }, 0)])
      return acc
    }, [] as any[]).filter(([_, v]) => v > 0)
  })
})
onMounted(() => {
  if (svg.value)
    charts.value = echarts.init(svg.value)
})
watch(() => state.list, () => {
  if (!svg.value)
    return

  const now = dayjs()

  charts.value?.setOption({
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
      formatter(params: any) {
        return params.data?.[0]
      },
    },
    calendar: {
      orient: 'vertical',
      top: 60,
      left: 'center',
      bottom: 0,
      range: [`${now.format('YYYY')}-01`, `${now.add(1, 'year').format('YYYY')}-01`],
      cellSize: 40,
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
      data: state.list,
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
</script>

<template>
  <div class="p-2 pb-5">
    <div class="text-center">
      {{ dayjs().format("YYYY") }}
    </div>
    <h1 class="text-center">
      {{ name }}
    </h1>

    <div ref="svg" class="w-full h-250" />
  </div>
</template>

