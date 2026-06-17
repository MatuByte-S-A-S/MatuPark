import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ReportMetrics } from '@/utils/reports'
import { formatCurrency, formatDuration } from '@/utils/billing'
import { APP_NAME } from '@/constants/branding'

export function exportPdf(data: ReportMetrics, lotName: string) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(`${APP_NAME} — Reporte`, 14, 20)
  doc.setFontSize(11)
  doc.text(lotName, 14, 28)
  doc.text(`Período: ${data.periodLabel}`, 14, 36)

  autoTable(doc, {
    startY: 44,
    head: [['Métrica', 'Valor']],
    body: [
      ['Ingresos', formatCurrency(data.totalIncome)],
      ['Entradas', String(data.vehiclesEntered)],
      ['Salidas', String(data.vehiclesExited)],
      ['Carros (salidas)', String(data.carsExited)],
      ['Motos (salidas)', String(data.motosExited)],
      ['Ticket promedio', formatCurrency(data.avgTicket)],
      ['Estancia promedio', formatDuration(data.avgDurationMinutes)],
      ['Estancia máxima', data.maxDurationLabel],
      ['Promedio diario', formatCurrency(data.dailyAverage)],
    ],
  })

  doc.save(`reporte-matupark-${Date.now()}.pdf`)
}

export function exportExcel(data: ReportMetrics, lotName: string) {
  const summary = [
    { Parqueadero: lotName, Período: data.periodLabel },
    { Métrica: 'Ingresos', Valor: data.totalIncome },
    { Métrica: 'Entradas', Valor: data.vehiclesEntered },
    { Métrica: 'Salidas', Valor: data.vehiclesExited },
    { Métrica: 'Carros salidas', Valor: data.carsExited },
    { Métrica: 'Motos salidas', Valor: data.motosExited },
    { Métrica: 'Ticket promedio', Valor: data.avgTicket },
    { Métrica: 'Estancia promedio (min)', Valor: data.avgDurationMinutes },
    { Métrica: 'Promedio diario', Valor: data.dailyAverage },
  ]

  const daily = data.dailyTrend.map((d) => ({
    Día: d.label,
    Entradas: d.entries,
    Salidas: d.exits,
    Carros: d.carsIn,
    Motos: d.motosIn,
    Ingresos: d.income,
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), 'Por día')
  XLSX.writeFile(wb, `reporte-matupark-${Date.now()}.xlsx`)
}
