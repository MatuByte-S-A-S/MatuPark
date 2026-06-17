import { matudb } from '@/lib/matudb'

/** Normaliza la respuesta de insert/update de MatuDB (objeto o array). */
export function rowFromWrite<T>(data: unknown): T | null {
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return data as T
}

/** SELECT una fila por columna. */
export async function fetchRow<T>(
  table: string,
  column: string,
  value: string | number
): Promise<{ data: T | null; error: { message?: string; code?: string } | null }> {
  const { data, error } = await matudb.from(table).select('*').eq(column, value).single()
  return { data: (data as T) ?? null, error }
}

/**
 * UPDATE en MatuDB: filtros primero, luego .update().
 * @example await updateRow('parking_lots', { id }, { name: 'Nuevo' })
 */
export async function updateRow<T = unknown>(
  table: string,
  filters: Record<string, string | number | boolean>,
  data: Record<string, unknown>
): Promise<{ data: T | null; error: { message?: string; code?: string } | null }> {
  let query = matudb.from(table)
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }
  const { data: rows, error } = await query.update(data)
  if (error) return { data: null, error }
  return { data: rowFromWrite<T>(rows), error: null }
}
