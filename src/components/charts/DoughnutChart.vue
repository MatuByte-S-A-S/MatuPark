<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.colors ?? ['#060606', '#d7ee46', '#eff0ef'],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#8a8a8a', padding: 16 } },
  },
}
</script>

<template>
  <div class="h-56">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>
