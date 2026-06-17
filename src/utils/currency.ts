export type CurrencyCode = 'COP' | 'USD' | 'EUR' | 'MXN'

export interface CurrencyConfig {
  code: CurrencyCode
  locale: string
}

export const CURRENCY_OPTIONS: { code: CurrencyCode; locale: string; label: string }[] = [
  { code: 'COP', locale: 'es-CO', label: 'Peso colombiano (COP)' },
  { code: 'USD', locale: 'en-US', label: 'Dólar estadounidense (USD)' },
  { code: 'EUR', locale: 'es-ES', label: 'Euro (EUR)' },
  { code: 'MXN', locale: 'es-MX', label: 'Peso mexicano (MXN)' },
]

const DEFAULT: CurrencyConfig = { code: 'COP', locale: 'es-CO' }

export function getCurrencyConfig(
  settings?: { currency_code?: string | null; currency_locale?: string | null } | null
): CurrencyConfig {
  const code = (settings?.currency_code || DEFAULT.code) as CurrencyCode
  const match = CURRENCY_OPTIONS.find((c) => c.code === code)
  const locale = settings?.currency_locale || match?.locale || DEFAULT.locale
  return { code, locale }
}

export function currencyFractionDigits(code: CurrencyCode): number {
  return code === 'COP' ? 0 : 2
}

export function toAmount(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatCurrencyValue(
  value: unknown,
  config: CurrencyConfig = DEFAULT
): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: currencyFractionDigits(config.code),
    minimumFractionDigits: currencyFractionDigits(config.code),
  }).format(toAmount(value))
}

export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return 0
  return Number(digits)
}

export function formatCurrencyInput(value: number, config: CurrencyConfig = DEFAULT): string {
  if (!value) return ''
  return formatCurrencyValue(value, config)
}
