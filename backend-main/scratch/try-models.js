import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });


//code to test different mistral model to see which works 
const candidates = [
  "mistral-small-latest",
  "ministral-8b-latest",
  "ministral-3b-latest",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const model of candidates) {
  try {
    const res = await client.chat.complete({
      model,
      messages: [{ role: "user", content: "Say hello in one short sentence." }],
    });
    console.log(`${model}: ${res.choices[0].message.content}`);
  } catch (err) {
    console.log(` ${model}: ${err.statusCode} ${err.message.slice(0, 80)}`);
  }
  await sleep(5000); // wait 5 seconds pause to avoid rate-limit error
}