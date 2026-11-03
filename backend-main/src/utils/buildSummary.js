const round = (n) => Math.round(n);
const sum = (list) => list.reduce((total, n) => total + n, 0);
const average = (list) => (list.length ? sum(list) / list.length : 0);


function monthsUntil(targetDate, today) {
  const t = new Date(targetDate);
  let months =
    (t.getUTCFullYear() - today.getUTCFullYear()) * 12 +
    (t.getUTCMonth() - today.getUTCMonth());
  if (t.getUTCDate() < today.getUTCDate()) months -= 1;
  return Math.max(1, months);
}

export function buildSummary(data, today = new Date()) {
  const { customer, financial_summary: fs, savings_history, recent_transactions = [] } = data;

  const income = fs.monthly_household_income;
  const expenses = fs.monthly_expenses;
  const contribution = fs.monthly_savings_contribution;


  const history = [...savings_history].sort((a, b) => a.month.localeCompare(b.month));
  const actuals = history.map((h) => h.actual);
  const plannedTotal = sum(history.map((h) => h.planned));
  const actualTotal = sum(actuals);
  const plannedMonthly = round(average(history.map((h) => h.planned)));
  const averageActualMonthly = round(average(actuals));

  const monthsBelowPlan = history.filter((h) => h.actual < h.planned).length;
  const monthsWithZero = history.filter((h) => h.actual === 0).map((h) => h.month);


  const half = Math.floor(actuals.length / 2);
  const earlierAverage = average(actuals.slice(0, half));
  const recentAverage = average(actuals.slice(actuals.length - half));

  let recentTrend = "not enough data";
  if (actuals.length >= 4) {
    if (recentAverage < earlierAverage * 0.85) recentTrend = "declining";
    else if (recentAverage > earlierAverage * 1.15) recentTrend = "improving";
    else recentTrend = "steady";
  }

  const amountRemaining = Math.max(0, fs.target_amount - fs.current_savings_balance);
  const monthsRemaining = monthsUntil(fs.target_date, today);
  const requiredMonthly = Math.ceil(amountRemaining / monthsRemaining);
  const monthlyGap = Math.max(0, requiredMonthly - contribution);

  const projectedBalance = fs.current_savings_balance + contribution * monthsRemaining;
  const projectedShortfall = Math.max(0, fs.target_amount - projectedBalance);

  const ifNextMonthMissed =
    monthsRemaining > 1 && amountRemaining > 0
      ? { newRequiredMonthly: Math.ceil(amountRemaining / (monthsRemaining - 1)) }
      : null;

  const recentExpensesByCategory = {};
  for (const t of recent_transactions) {
    if (t.type === "expense") {
      const key = t.category || "other";
      recentExpensesByCategory[key] = (recentExpensesByCategory[key] || 0) + t.amount;
    }
  }

  return {
    household: customer.household_name,
    currency: customer.currency,

    monthlyIncome: income,
    monthlyExpenses: expenses,
    expenseSharePercent: round((expenses / income) * 100),
    incomeAfterExpenses: income - expenses,
    recentExpensesByCategory,

    currentBalance: fs.current_savings_balance,
    targetAmount: fs.target_amount,
    targetDate: fs.target_date,
    percentComplete: Math.round((fs.current_savings_balance / fs.target_amount) * 1000) / 10,
    amountRemaining,
    monthsRemaining,
    requiredMonthly,
    requiredShareOfIncomePercent: round((requiredMonthly / income) * 100),

    monthlySavingsContribution: contribution,
    savingsRatePercent: round((contribution / income) * 100),
    monthlyGap,
    projectedBalanceAtCurrentPace: projectedBalance,
    projectedShortfall,
    ifNextMonthMissed,

    monthsTracked: history.length,
    plannedMonthly,
    averageActualMonthly,
    shortfallVsPlan: Math.max(0, plannedMonthly - averageActualMonthly),
    percentOfPlanMet: round((actualTotal / plannedTotal) * 100),
    monthsMetPlan: history.length - monthsBelowPlan,
    monthsBelowPlan,
    monthsWithZero,
    earlierAverage: round(earlierAverage),
    recentAverage: round(recentAverage),
    recentTrend,
  };
}