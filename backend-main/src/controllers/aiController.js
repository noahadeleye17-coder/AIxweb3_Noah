import { analyseSavings } from "../services/aiService.js";
import { getFallbackResponse } from "../services/fallbackService.js";
import { buildSummary } from "../utils/buildSummary.js";
import { buildMeta } from "../utils/buildMeta.js";
import { normalizeInput } from "../utils/normalizeInput.js";
import { validateInput } from "../utils/validateInput.js";

export async function analyseSavingsController(req, res) {
  try {
    const data = req.body;

    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const input = normalizeInput(data);
    const problems = validateInput(input);
    if (problems.length > 0) {
      return res.status(400).json({ error: "Invalid input", problems });
    }

    const facts = buildSummary(input);

    // Mock mode: skip Mistral
    if (process.env.AI_MODE !== "live") {
      return res.json({
        analysis: getFallbackResponse(facts),
        meta: buildMeta("mock", facts),
        facts,
      });
    }

    // Live mode: ask Mistral, fall back if anything goes wrong
    try {
      const analysis = await analyseSavings(facts);
      return res.json({ analysis, meta: buildMeta("ai", facts), facts });
    } catch (err) {
      console.error("AI failed, using fallback:", err.message);
      return res.json({
        analysis: getFallbackResponse(facts),
        meta: buildMeta("mock", facts),
        facts,
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Something went wrong while analysing the data" });
  }
}