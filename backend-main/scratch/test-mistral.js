import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

//Simple code to test how mistral work with one role "user"
const response = await client.chat.complete({
  model: process.env.MISTRAL_MODEL,
  messages: [
    {
      role: "user",
      content: "Who is the best French painter? Answer in one short sentence.",
    },
  ],
});

console.log(response.choices[0].message.content);