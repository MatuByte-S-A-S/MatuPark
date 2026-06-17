<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  series: { label: string; data: number[]; color: string }[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.series.map((s) => ({
    label: s.label,
    data: s.data,
    backgroundColor: s.color,
    borderRadius: 6,
  })),
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: '#8a8a8a', boxWidth: 12 } } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#eff0ef' }, ticks: { stepSize: 1, color: '#8a8a8a' } },
    x: { grid: { display: false }, ticks: { color: '#8a8a8a', maxRotation: 45, minRotation: 0 } },
  },
}
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
