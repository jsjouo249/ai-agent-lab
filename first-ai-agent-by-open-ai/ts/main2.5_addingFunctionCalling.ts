import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";
import * as readline from "readline";

const client = new OpenAI();

type Message = OpenAI.Chat.ChatCompletionMessageParam;
type ChatCompletionMessage = OpenAI.Chat.ChatCompletionMessage;

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

function processAIResponse(message: ChatCompletionMessage): void {
  if (message.tool_calls) {
    messages.push({
      role: "assistant",
      content: message.content || "",
      tool_calls: message.tool_calls.map((toolCall) => ({
        id: toolCall.id,
        type: "function" as const,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      })),
    });

    for (const toolCall of message.tool_calls) {
      const functionName = toolCall.function.name;
      const argumentsStr = toolCall.function.arguments;

      console.log(`Calling function: ${functionName} with arguments: ${argumentsStr}`);

      let args: Record<string, string> = {};
      try {
        args = JSON.parse(argumentsStr);
      } catch {
        args = {};
      }

      const functionToRun = FUNCTION_MAP[functionName];

      // TypeScript에서는 spread operator로 object를 함수 인자로 전달할 수 없으므로
      // city 값을 직접 추출하여 전달
      const result = functionToRun(args.city);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}

async function callAI(): Promise<void> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    tools: TOOLS,
  });

  processAIResponse(response.choices[0].message);
  console.log(response);

  const toolCalls = response.choices[0].message.tool_calls;
  messages.push({ role: "assistant", content: JSON.stringify(toolCalls) });
  console.log(`AI: ${JSON.stringify(toolCalls)}`);
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
