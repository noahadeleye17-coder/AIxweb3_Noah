import { readFileSync } from "fs";
import { ACTION_TYPES } from "../config/analysisTypes.js";

const t = JSON.parse(
  readFileSync(new URL("../data/fallbackResponse.json", import.meta.url), "utf-8")
);

const monthYear = (date) =>
  new Date(date).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const monthName = (m) => monthYear(`${m}-01`);

// Last resort, used only if building from the templates fails
const GENERIC_ANALYSIS = {
  summary: "A detailed analysis is not available right now. Please review the figures shown on the dashboard.",
  observations: [
    { type: "consistency", message: "Consistency could not be assessed right now." },
    { type: "spending", message: "Spending could not be assessed right now." },
    { type: "progress", message: "Progress could not be assessed right now." },
  ],
  recommendations: [
    { title: "Review your savings plan", description: "Check your monthly contribution against your target date." },
    { title: "Make saving automatic", description: "Set up a recurring transfer or reminder for the day income arrives." },
    { title: "Check progress each month", description: "Compare each month's contribution with the plan and adjust early." },
  ],
  suggested_action: { label: "Review monthly savings plan", type: ACTION_TYPES[0] },
};

// Can throw. Exported so the edge-case script can see template problems.
export function buildTemplatedAnalysis(facts) {
  const money = (n) => `${facts.currency} ${Number(n).toLocaleString("en-US")}`;

  const goalReached = facts.goalReached;
  const behind = facts.projectedShortfall > 0;
  const declining = facts.recentTrend === "declining";
  const noContribution = facts.monthlySavingsContribution === 0;
  const hasExpenses = facts.monthlyExpenses !== null;
  const hasHistory = facts.monthsTracked > 0;

  const values = {
    household: facts.household,
    currentBalance: money(facts.currentBalance),
    targetAmount: money(facts.targetAmount),
    targetDate: monthYear(facts.targetDate),
    percentComplete: facts.percentComplete,
    monthlySavingsContribution: money(facts.monthlySavingsContribution),
    projectedBalance: money(facts.projectedBalanceAtCurrentPace),
    projectedShortfall: money(facts.projectedShortfall),
    plannedMonthly: money(facts.plannedMonthly),
    averageActualMonthly: money(facts.averageActualMonthly),
    shortfallVsPlan: money(facts.shortfallVsPlan),
    monthsTracked: facts.monthsTracked,
    monthsMetPlan: facts.monthsMetPlan,
    monthsWithZero: facts.monthsWithZero.map(monthName).join(", "),
    earlierAverage: money(facts.earlierAverage),
    recentAverage: money(facts.recentAverage),
    expenseSharePercent: facts.expenseSharePercent,
    incomeAfterExpenses: money(facts.incomeAfterExpenses),
    monthlyExpenses: money(facts.monthlyExpenses),
    monthlyIncome: money(facts.monthlyIncome),
    requiredMonthly: money(facts.requiredMonthly),
    monthlyGap: money(facts.monthlyGap),
    requiredShare: facts.requiredShareOfIncomePercent,
    newRequiredMonthly: facts.ifNextMonthMissed
      ? money(facts.ifNextMonthMissed.newRequiredMonthly)
      : "",
  };

  const fill = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));

  // Summary
  let summaryKey = "on_track";
  if (goalReached) summaryKey = "goal_reached";
  else if (behind && noContribution) summaryKey = "no_contribution";
  else if (behind && declining) summaryKey = "behind_declining";
  else if (behind) summaryKey = "behind";

  // Consistency
  let consistency;
  if (!hasHistory) {
    consistency = fill(t.consistency.no_history);
  } else {
    const key =
      facts.monthsMetPlan === 0 ? "never_met" : facts.monthsBelowPlan === 0 ? "all_met" : "some_met";
    const parts = [fill(t.consistency[key])];
    if (facts.monthsWithZero.length > 0) parts.push(fill(t.consistencyExtras.zeroMonths));
    if (t.consistencyExtras[facts.recentTrend]) {
      parts.push(fill(t.consistencyExtras[facts.recentTrend]));
    }
    consistency = parts.join(" ");
  }

  // Spending
  let spending;
  if (!hasExpenses) spending = fill(t.spending.no_expenses);
  else if (facts.incomeAfterExpenses < 0) spending = fill(t.spending.over_income);
  else spending = fill(t.spending.normal);

  // Progress
  const progressKey = goalReached ? "goal_reached" : behind ? "behind" : "on_track";

  // Recommendations
  const rec = t.recommendations;
  let first;
  if (goalReached) {
    first = { title: rec.nextStep.title, description: fill(rec.nextStep.description) };
  } else if (behind) {
    first = {
      title: rec.closeGap.title,
      description:
        fill(rec.closeGap.description) +
        (facts.ifNextMonthMissed ? " " + fill(rec.closeGapMissed) : ""),
    };
  } else {
    first = { title: rec.keepGoing.title, description: fill(rec.keepGoing.description) };
  }
  const third = behind && hasExpenses ? rec.reviewSpending : rec.reviewProgress;

  return {
    summary: fill(t.summary[summaryKey]),
    observations: [
      { type: "consistency", message: consistency },
      { type: "spending", message: spending },
      { type: "progress", message: fill(t.progress[progressKey]) },
    ],
    recommendations: [
      first,
      { title: rec.automate.title, description: fill(rec.automate.description) },
      { title: third.title, description: fill(third.description) },
    ],
    suggested_action: { label: t.action.label, type: ACTION_TYPES[0] },
  };
}

// Never throws: if the templates fail, a generic answer is returned
export function getFallbackResponse(facts) {
  try {
    return buildTemplatedAnalysis(facts);
  } catch (err) {
    console.error("Fallback templates failed, using generic answer:", err.message);
    return GENERIC_ANALYSIS;
  }
}