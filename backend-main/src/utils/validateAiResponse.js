import { OBSERVATION_TYPES, ACTION_TYPES } from "../config/analysisTypes.js";

const BANNED_PATTERNS = [
  /\binvest(ment|ments|ing|or|ors)?\b/i,
  /\bguarantee[sd]?\b/i,
];

// Wording that contradicts the facts. Add or remove rules here.
const CONTRADICTIONS = [
    {
    applies: (f) => f.projectedShortfall > 0,
    pattern: /\b(?:is|are)\s+on\s+track\b(?!\s+to\s+(?:fall|miss|end|come|finish))|\bon\s+track\s+to\s+(?!fall|miss|end|come|finish)/i,
    problem: "says the household is on track, but the facts show a projected shortfall",
  },
  {
    applies: (f) => f.recentTrend === "declining",
    pattern: /\b(steady|steadily|improving)\b/i,
    problem: "calls contributions steady or improving, but the facts say declining",
  },
];

const NUMBER_PATTERN = /\d+(?:,\d{3})*(?:\.\d+)?/g;

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractNumbers(text) {
  return (text.match(NUMBER_PATTERN) || []).map((n) => Number(n.replace(/,/g, "")));
}

// Fixes "NGN2,000,000" and "savingNGN" (cannot fix other joined words)
function repairSpacing(text, currency) {
  const c = escapeRegex(currency);
  return text
    .replace(new RegExp(`(${c})(?=\\d)`, "g"), "$1 ")
    .replace(new RegExp(`([a-z])(${c})\\b`, "g"), "$1 $2")
    .trim();
}

export function validateAiResponse(reply, facts) {
  if (!isObject(reply) || !isObject(reply.analysis)) {
    return { valid: false, problems: ['Reply must be an object with an "analysis" object'] };
  }

  const a = reply.analysis;
  const problems = [];

  // Layer 1: structure
  if (!isNonEmptyString(a.summary)) {
    problems.push("analysis.summary must be a non-empty string");
  }

  if (!Array.isArray(a.observations) || a.observations.length === 0) {
    problems.push("analysis.observations must be a non-empty array");
  } else {
    a.observations.forEach((o, i) => {
      if (!isObject(o) || !OBSERVATION_TYPES.includes(o.type)) {
        problems.push(`observations[${i}].type must be one of: ${OBSERVATION_TYPES.join(", ")}`);
      }
      if (!isObject(o) || !isNonEmptyString(o.message)) {
        problems.push(`observations[${i}].message must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(a.recommendations) || a.recommendations.length === 0) {
    problems.push("analysis.recommendations must be a non-empty array");
  } else {
    a.recommendations.forEach((r, i) => {
      if (!isObject(r) || !isNonEmptyString(r.title)) {
        problems.push(`recommendations[${i}].title must be a non-empty string`);
      }
      if (!isObject(r) || !isNonEmptyString(r.description)) {
        problems.push(`recommendations[${i}].description must be a non-empty string`);
      }
    });
  }

  const action = a.suggested_action;
  if (!isObject(action) || !isNonEmptyString(action.label)) {
    problems.push("analysis.suggested_action.label must be a non-empty string");
  }
  if (!isObject(action) || !ACTION_TYPES.includes(action.type)) {
    problems.push(`analysis.suggested_action.type must be one of: ${ACTION_TYPES.join(", ")}`);
  }

  if (problems.length > 0) return { valid: false, problems };

  // Clean the text and keep only the fields the FE expects
  const fix = (t) => repairSpacing(t, facts.currency);
  const value = {
    summary: fix(a.summary),
    observations: a.observations.slice(0, 3).map((o) => ({
      type: o.type,
      message: fix(o.message),
    })),
    recommendations: a.recommendations.slice(0, 3).map((r) => ({
      title: fix(r.title),
      description: fix(r.description),
    })),
    suggested_action: { label: fix(action.label), type: action.type },
  };

  // Layer 2: safety rules, checked on the cleaned text
  const allText = [
    value.summary,
    ...value.observations.map((o) => o.message),
    ...value.recommendations.flatMap((r) => [r.title, r.description]),
    value.suggested_action.label,
  ].join(" ");

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(allText)) problems.push(`Banned wording found: ${pattern}`);
  }

  for (const rule of CONTRADICTIONS) {
    if (rule.applies(facts) && rule.pattern.test(allText)) {
      problems.push(`Text ${rule.problem}`);
    }
  }

  // Every number in the text must exist in the facts (small counts up to 12 are allowed)
  const allowed = new Set(extractNumbers(JSON.stringify(facts)));
  for (const n of extractNumbers(allText)) {
    const isSmallCount = Number.isInteger(n) && n <= 12;
    if (!allowed.has(n) && !isSmallCount) {
      problems.push(`Number ${n} is not in the facts`);
    }
  }

  if (problems.length > 0) return { valid: false, problems };
  return { valid: true, value };
}