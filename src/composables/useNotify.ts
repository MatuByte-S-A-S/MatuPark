import { ref } from 'vue'

export type NotifyType = 'success' | 'error' | 'info'

const visible = ref(false)
const type = ref<NotifyType>('success')
const title = ref('')
const message = ref('')

let timer: ReturnType<typeof setTimeout>

export function useNotify() {
  function show(t: NotifyType, tit: string, msg = '') {
    type.value = t
    title.value = tit
    message.value = msg
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, 3200)
  }

  function success(tit: string, msg = '') {
    show('success', tit, msg)
  }

  function error(tit: string, msg = '') {
    show('error', tit, msg)
  }

  function close() {
    visible.value = false
    clearTimeout(timer)
  }

  return { visible, type, title, message, show, success, error, close }
}
