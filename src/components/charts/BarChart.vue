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
  cars: number[]
  motos: number[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    { label: 'Carros', data: props.cars, backgroundColor: '#060606', borderRadius: 8 },
    { label: 'Motos', data: props.motos, backgroundColor: '#d7ee46', borderRadius: 8 },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: '#8a8a8a' } } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#eff0ef' } },
    x: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
