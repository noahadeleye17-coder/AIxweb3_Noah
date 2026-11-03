export const DISCLAIMER =
  "Generated suggestions, not verified facts or financial advice.";

export function buildMeta(source, facts) {
  const confidence =
    facts.monthsTracked >= 12 ? "high" : facts.monthsTracked >= 4 ? "medium" : "low";
  return { source, confidence, disclaimer: DISCLAIMER };
}