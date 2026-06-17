import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { APP_DESCRIPTION, APP_FULL_TITLE } from '@/constants/branding'

export interface SeoMeta {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function removeMeta(name: string, attr: 'name' | 'property' = 'name') {
  document.querySelector(`meta[${attr}="${name}"]`)?.remove()
}

const DEFAULT_TITLE = APP_FULL_TITLE
const DEFAULT_DESC = APP_DESCRIPTION

export function usePageSeo(meta: Ref<SeoMeta | null> | SeoMeta | null) {
  const apply = (m: SeoMeta | null) => {
    const title = m?.title ?? DEFAULT_TITLE
    const description = m?.description ?? DEFAULT_DESC
    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('og:type', m?.type ?? 'website', 'property')
    if (m?.url) {
      setMeta('og:url', m.url, 'property')
      setMeta('twitter:url', m.url)
    } else {
      removeMeta('og:url', 'property')
      removeMeta('twitter:url')
    }
    if (m?.image) {
      setMeta('og:image', m.image, 'property')
      setMeta('twitter:image', m.image)
      setMeta('twitter:card', 'summary_large_image')
    } else {
      removeMeta('og:image', 'property')
      removeMeta('twitter:image')
      setMeta('twitter:card', 'summary')
    }
  }

  onMounted(() => {
    if (meta && 'value' in meta) {
      watch(meta, apply, { immediate: true })
    } else {
      apply(meta)
    }
  })

  onUnmounted(() => apply(null))
}
