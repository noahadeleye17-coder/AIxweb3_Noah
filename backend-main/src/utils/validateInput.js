const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// Expects input that has already been through normalizeInput
export function validateInput(input, today = new Date()) {
  const fs = input?.financial_summary;
  if (!fs || Object.keys(fs).length === 0) return ["financial_summary is required"];

  const problems = [];

  if (!isNumber(fs.monthly_household_income) || fs.monthly_household_income <= 0) {
    problems.push("financial_summary.monthly_household_income must be a number greater than 0");
  }
  if (!isNumber(fs.current_savings_balance) || fs.current_savings_balance < 0) {
    problems.push("financial_summary.current_savings_balance must be a number, 0 or more");
  }
  if (!isNumber(fs.target_amount) || fs.target_amount <= 0) {
    problems.push("financial_summary.target_amount must be a number greater than 0");
  }
  if (!isNumber(fs.monthly_savings_contribution) || fs.monthly_savings_contribution < 0) {
    problems.push("financial_summary.monthly_savings_contribution must be a number, 0 or more (use 0 if nothing is being saved)");
  }
  if (fs.monthly_expenses !== undefined && (!isNumber(fs.monthly_expenses) || fs.monthly_expenses < 0)) {
    problems.push("financial_summary.monthly_expenses must be a number, 0 or more (or leave it out)");
  }

  const target = new Date(fs.target_date);
  if (typeof fs.target_date !== "string" || Number.isNaN(target.getTime())) {
    problems.push('financial_summary.target_date must be a date string like "2027-10-01"');
  } else if (target <= today) {
    problems.push("financial_summary.target_date must be in the future");
  }

  // savings_history may be empty, but if it has entries they must be well-formed
  if (!Array.isArray(input.savings_history)) {
    problems.push("savings_history must be a list (it can be empty)");
  } else {
    input.savings_history.forEach((h, i) => {
      if (!MONTH_PATTERN.test(h?.month)) {
        problems.push(`savings_history[${i}].month must look like "2026-01"`);
      }
      if (!isNumber(h?.planned) || h.planned < 0) {
        problems.push(`savings_history[${i}].planned must be a number, 0 or more`);
      }
      if (!isNumber(h?.actual) || h.actual < 0) {
        problems.push(`savings_history[${i}].actual must be a number, 0 or more`);
      }
    });
  }

  if (input.recent_transactions !== undefined) {
    if (!Array.isArray(input.recent_transactions)) {
      problems.push("recent_transactions must be a list");
    } else {
      input.recent_transactions.forEach((t, i) => {
        if (!isNumber(t.amount) || t.amount < 0) {
          problems.push(`recent_transactions[${i}].amount must be a number, 0 or more`);
        }
      });
    }
  }

  return problems;
}