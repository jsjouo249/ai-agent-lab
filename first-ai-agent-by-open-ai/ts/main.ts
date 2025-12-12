import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";

const client = new OpenAI();

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "user", content: "What is the capital of the greece?" }
  ],
});

console.log(response);

const message = response.choices[0].message.content;
console.log(message);
