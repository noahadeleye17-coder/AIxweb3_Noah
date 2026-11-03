const MONTH_MS = 1000 * 60 * 60 * 24 * 30.4375

const addMonths = (date, months) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + Math.ceil(months))
  return d
}

export function monthsUntil(targetDate, now = new Date()) {
  const target = new Date(targetDate)
  if (Number.isNaN(target.getTime())) return 0
  return Math.max(0, Math.ceil((target.getTime() - new Date(now).getTime()) / MONTH_MS))
}

export function requiredMonthly(remaining, monthsLeft) {
  if (!(Number(remaining) > 0)) return 0
  return Math.ceil(Number(remaining) / Math.max(Number(monthsLeft) || 0, 1))
}

export function actualAverage(contributions) {
  const rows = contributions || []
  if (!rows.length) return 0
  return rows.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) / rows.length
}

export function projectedFinishDate(remaining, average, now = new Date()) {
  if (!(Number(remaining) > 0)) return new Date(now)
  if (!(Number(average) > 0)) return null
  return addMonths(now, Number(remaining) / Number(average))
}

export function catchUpPerMonth({ remaining, monthsLeft, average }) {
  const shortfall = Number(remaining) - (Number(average) || 0) * Math.max(Number(monthsLeft) || 0, 0)
  if (!(shortfall > 0)) return 0
  return Math.ceil(shortfall / Math.max(Number(monthsLeft) || 0, 1))
}

export function paceSummary({ goal, savings, now = new Date() }) {
  const contributions = savings?.contributions || []
  const targetAmount = Number(goal?.targetAmount) || 0
  const balance = Number(savings?.currentBalance ?? goal?.currentBalance) || 0
  const remaining = Math.max(0, Number(goal?.amountRemaining ?? targetAmount - balance) || 0)
  const monthsLeft = monthsUntil(goal?.targetDate, now)
  const average = actualAverage(contributions)
  const required = requiredMonthly(remaining, monthsLeft)
  const projected = projectedFinishDate(remaining, average, now)
  const catchUp = catchUpPerMonth({ remaining, monthsLeft, average })
  const goalReached = remaining <= 0
  const targetDate = new Date(goal?.targetDate)
  const onTime =
    goalReached ||
    (projected != null &&
      !Number.isNaN(targetDate.getTime()) &&
      projected.getTime() <= targetDate.getTime())
  const behindBy = onTime ? 0 : Math.max(0, remaining - average * monthsLeft)

  return {
    requiredMonthly: required,
    actualAverage: average,
    projectedFinishDate: projected,
    catchUpPerMonth: catchUp,
    behindBy,
    monthsLeft,
    goalReached,
    onTrack: onTime,
    hasHistory: contributions.length > 0,
  }
}
