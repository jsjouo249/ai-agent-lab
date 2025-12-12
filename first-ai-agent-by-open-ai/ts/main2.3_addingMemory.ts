import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";
import * as readline from "readline";


const client = new OpenAI();

type Message = OpenAI.Chat.ChatCompletionMessageParam;

const messages: Message[] = [];

async function callAI(): Promise<void> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
  });

  const message = response.choices[0].message.content;
  messages.push({ role: "assistant", content: message });
  console.log(`AI: ${message}`);
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): void => {
    rl.question("Send a message to the LLM... ", async (input: string) => {
      if (input === "quit" || input === "q") {
        rl.close();
        return;
      }

      messages.push({ role: "user", content: input });
      console.log(`User: ${input}`);
      await callAI();
      askQuestion();
    });
  };

  askQuestion();
}

main();
