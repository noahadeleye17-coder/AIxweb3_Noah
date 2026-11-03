import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });


//code to test how mistral works 
const response = await client.chat.complete({
  model: process.env.MISTRAL_MODEL,
  responseFormat: { type: "json_object" },
  messages: [
    {
      role: "system",
      content:
        "You analyse synthetic savings data. Reply with JSON only, with keys: " +
        "summary (string), observations (string array), recommendations (string array), " +
        "suggestedAction (string), confidence (low|medium|high).",
    },
    {
      role: "user",
      content: JSON.stringify({
        goal: { targetAmount: 500000, targetDate: "2027-03-01" },
        savings: {
          balance: 120000,
          contributions: [
            { date: "2026-08-01", amount: 20000 },
            { date: "2026-09-01", amount: 15000 },
            { date: "2026-10-01", amount: 5000 },
          ],
        },
      }),
    },
  ],
});

const text = response.choices[0].message.content;
console.log("RAW TEXT:\n", text);

const parsed = JSON.parse(text);
console.log("\nPARSED OK. Summary:", parsed.summary);