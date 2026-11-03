const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const formatter = (currency, options = {}) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    ...options,
  })

export function formatMoney(value, currency = 'NGN') {
  const n = toNumber(value)
  if (n === null) return '—'
  try {
    return formatter(currency).format(n)
  } catch {
    return `${currency} ${n.toLocaleString('en-NG')}`
  }
}

export function formatCompactMoney(value, currency = 'NGN') {
  const n = toNumber(value)
  if (n === null) return '—'
  try {
    return formatter(currency, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  } catch {
    return formatMoney(n, currency)
  }
}

export function formatMonth(month, year = '2-digit') {
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) return month || '—'
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    year,
    timeZone: 'UTC',
  })
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' })
}
