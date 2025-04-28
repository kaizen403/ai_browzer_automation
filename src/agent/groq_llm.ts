// src/agent/groq_llm.ts
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Shared ChatGroq instance, configured via env vars.
 */
export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL_NAME || "llama3-8b-8192",
  temperature: process.env.GROQ_TEMPERATURE
    ? parseFloat(process.env.GROQ_TEMPERATURE)
    : 0.7,
});

/**
 * Sends a system+user chat to Groq and returns the assistant’s reply as a string.
 */
export async function invokeGroq(userPrompt: string): Promise<string> {
  const system = new SystemMessage(
    "You are an AI assistant that decomposes user instructions into structured tasks and subtasks in JSON format.",
  );
  const human = new HumanMessage(userPrompt);

  // invoke() returns a single AIMessageChunk
  const aiChunk = await llm.invoke([system, human]);

  // extract the text from that chunk
  // you can use either .text or toString()
  return aiChunk.text;
}
