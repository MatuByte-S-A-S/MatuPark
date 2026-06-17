<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  labels: string[]
  data: number[]
  label?: string
  color?: string
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label || 'Valor',
      data: props.data,
      borderColor: props.color || '#060606',
      backgroundColor: 'rgba(215, 238, 70, 0.35)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#d7ee46',
      pointBorderColor: '#060606',
      pointBorderWidth: 2,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#eff0ef' }, ticks: { color: '#8a8a8a' } },
    x: { grid: { display: false }, ticks: { color: '#8a8a8a' } },
  },
}
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="options" />
  </div>
</template>
