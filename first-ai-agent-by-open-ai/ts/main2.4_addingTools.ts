import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";
import * as readline from "readline";

const client = new OpenAI();

type Message = OpenAI.Chat.ChatCompletionMessageParam;

const messages: Message[] = [];

function getWeather(city: string): string {
  return `The weather in ${city} is 33 degrees celcius.`;
}

const FUNCTION_MAP: Record<string, (city: string) => string> = {
  get_weather: getWeather,
};

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "A function to get the weather of a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "The name of the city to get the weather of",
          },
        },
        required: ["city"],
      },
    },
  },
];

async function callAI(): Promise<void> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    tools: TOOLS,
  });

  console.log(response);
  console.log(response.choices[0].message.tool_calls);

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
