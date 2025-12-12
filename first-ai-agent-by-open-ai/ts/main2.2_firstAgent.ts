import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";

const client = new OpenAI();

const PROMPT = `
I HAVE the following functions in my system.

\`get_weather\`
\`get_currency\`
\`get_news\`

ALL of them receive the name of a country as an argument. (i.e get_news('Spain'))

Please answer with the name of the function that you would like me to run.

PLeare say nothing else, junst the name of the function with the arguments.

Answer the following question:

What is the weather in Greece?
`;

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: PROMPT }],
  });

  console.log("Response:", response);

  const message = response.choices[0].message.content;
  console.log("Message:", message);
}

main();
