import { Mistral } from "@mistralai/mistralai";
import { SYSTEM_PROMPT } from "./aiPrompt.js";
import { validateAiResponse } from "../utils/validateAiResponse.js";

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Mistral did not answer within ${ms} ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const MAX_ATTEMPTS = 2;

export async function analyseSavings(facts) {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  const timeoutMs = Number(process.env.MISTRAL_TIMEOUT_MS) || 15000;

  const { recentExpensesByCategory, ...modelFacts } = facts;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(modelFacts) },
  ];

  let lastProblems = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await withTimeout(
      client.chat.complete({
        model: process.env.MISTRAL_MODEL,
        temperature: 0.2,
        responseFormat: { type: "json_object" },
        messages,
      }),
      timeoutMs
    );

    const text = response.choices[0].message.content;

    let check;
    try {
      check = validateAiResponse(JSON.parse(text), facts);
    } catch {
      check = { valid: false, problems: ["Reply was not valid JSON"] };
    }

    if (check.valid) return check.value;

    lastProblems = check.problems;
    console.warn(`Attempt ${attempt} rejected: ${lastProblems.join("; ")}`);

    messages.push({ role: "assistant", content: text });
    messages.push({
      role: "user",
      content:
        "Your reply was rejected for these reasons: " +
        lastProblems.join("; ") +
        ". Write the full reply again in the same JSON shape, fixing only these problems. " +
        "Use only numbers that appear in the facts.",
    });
  }

  throw new Error("Invalid AI response after retry: " + lastProblems.join("; "));
}