import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });


// code to see all mistral models available to use 
const models = await client.models.list();
console.log(models.data.map((m) => m.id));