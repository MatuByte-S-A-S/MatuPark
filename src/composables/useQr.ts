import { ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import QRCode from 'qrcode'
import { appUrl } from '@/lib/matudb'

export function useQr(code: MaybeRefOrGetter<string>) {
  const dataUrl = ref('')

  async function generate() {
    const value = toValue(code)
    if (!value) {
      dataUrl.value = ''
      return
    }
    const url = `${appUrl}/ticket/${value}`
    dataUrl.value = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#060606', light: '#ffffff' },
    })
  }

  watch(() => toValue(code), generate, { immediate: true })

  return { dataUrl, ticketUrl: () => `${appUrl}/ticket/${toValue(code)}` }
}
