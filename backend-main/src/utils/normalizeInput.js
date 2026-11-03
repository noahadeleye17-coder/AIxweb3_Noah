function toNumber(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned !== "" && Number.isFinite(Number(cleaned))) return Number(cleaned);
  }
  return value;
}

const text = (value, fallback) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const NUMBER_FIELDS = [
  "monthly_household_income",
  "monthly_expenses",
  "current_savings_balance",
  "target_amount",
  "monthly_savings_contribution",
];

// Converts numeric text to numbers and fills safe defaults
export function normalizeInput(data) {
  const body = data && typeof data === "object" ? data : {};
  const customer = body.customer && typeof body.customer === "object" ? body.customer : {};
  const fs =
    body.financial_summary && typeof body.financial_summary === "object"
      ? { ...body.financial_summary }
      : {};

  for (const key of NUMBER_FIELDS) {
    if (key in fs) fs[key] = toNumber(fs[key]);
  }
  if (fs.monthly_expenses === null) delete fs.monthly_expenses;

  let history = body.savings_history;
  if (history === undefined || history === null) {
    history = [];
  } else if (Array.isArray(history)) {
    history = history.map((h) => ({
      month: typeof h?.month === "string" ? h.month.slice(0, 7) : h?.month,
      planned: toNumber(h?.planned),
      actual: toNumber(h?.actual),
    }));
  }

  let transactions = body.recent_transactions;
  if (Array.isArray(transactions)) {
    transactions = transactions.map((t) => ({ ...t, amount: toNumber(t?.amount) }));
  }

  return {
    customer: {
      ...customer,
      household_name: text(customer.household_name, "The household"),
      currency: text(customer.currency, "NGN").toUpperCase(),
    },
    financial_summary: fs,
    savings_history: history,
    recent_transactions: transactions,
  };
}