import { createClient } from '@devjuanes/matuclient'

export const matudb = createClient({
  url: import.meta.env.VITE_MATUDB_URL,
  projectId: import.meta.env.VITE_MATUDB_PROJECT_ID,
  apiKey: import.meta.env.VITE_MATUDB_API_KEY,
})

export const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
