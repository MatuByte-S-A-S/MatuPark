export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function uniqueParkingSlug(baseName: string): Promise<string> {
  const { matudb } = await import('@/lib/matudb')
  let slug = slugify(baseName) || 'parqueadero'
  let attempt = 0

  while (attempt < 10) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`
    const { data } = await matudb.from('parking_lots').select('id').eq('slug', candidate).limit(1)
    const rows = data as { id: string }[] | null
    if (!rows?.length) return candidate
    attempt++
  }

  return `${slug}-${Date.now().toString(36)}`
}
