// src/agent/planner.ts
import dotenv from "dotenv";
dotenv.config();

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RawTask, Task } from "./types";
import { v4 as uuid } from "uuid";

interface RawPlanObject {
  processId?: string;
  tasks: RawTask[];
}

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL_NAME || "llama3-8b-8192",
  temperature: process.env.GROQ_TEMPERATURE
    ? parseFloat(process.env.GROQ_TEMPERATURE)
    : 0.7,
});

/**
 * Decompose a user prompt into a structured plan:
 * - Ensures 'open' actions carry the URL in target.url
 * - Every action includes selectorDescription for Crawl4AI
 * - Leaves selector empty
 * - Assigns processId and step ordering
 */
export async function planTasks(prompt: string): Promise<Task[]> {
  const system = new SystemMessage(`
You are an AI assistant whose only job is to convert a user instruction into a single JSON object with two keys:
1) "processId": a UUID for this plan
2) "tasks": an ordered array of Task objects.

Each Task object must include exactly these keys:
- "step": integer (1-based order)
- "id": string (may be blank)
- "action": string (e.g. "open", "search", "play")
- "target": {
    "site": string,             // e.g. "Spotify"
    "url?": string              // required for "open" action, leave blank otherwise
  }
- "selectorDescription": string // a clear, human-readable hint about which page element to target
- "selector": string            // leave empty for now
- "params": object              // any extra arguments (e.g. { query: "Lean On" })
- "description": string         // human-friendly summary of the step
- "status": "pending"
- "subtasks?": []               // nested Task objects if this step needs substeps

Rules:
- For "open" or "navigate" actions, put the exact URL in target.url.
- For "search", "click", "play", etc., set target.url to "" and fill selectorDescription 
  (e.g. "the search input box at top of Spotify page").
- Do NOT include any keys beyond those listed.
- Return ONLY the JSON object (no extra text).

Example output:
{
  "processId":"<UUID>",
  "tasks":[
    {
      "step":1,
      "id":"",
      "action":"open",
      "target":{"site":"Spotify","url":"https://open.spotify.com"},
      "selectorDescription":"",
      "selector":"",
      "params":{},
      "description":"Open Spotify web player",
      "status":"pending"
    },
    {
      "step":2,
      "id":"",
      "action":"search",
      "target":{"site":"Spotify","url":""},
      "selectorDescription":"the search input box at the top of the page",
      "selector":"",
      "params":{"query":"Lean On"},
      "description":"Search for 'Lean On'",
      "status":"pending",
      "subtasks":[ /* only if needed */ ]
    }
  ]
}
  `);

  const human = new HumanMessage(prompt);
  const aiChunk = await llm.invoke([system, human]);
  const rawJson = aiChunk.text;

  let planObj: RawPlanObject;
  try {
    planObj = JSON.parse(rawJson) as RawPlanObject;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from Groq:\n${rawJson}\nError: ${err}`,
    );
  }

  const processId = planObj.processId || uuid();

  function normalize(raw: RawTask, step: number): Task {
    const id = raw.id || uuid();
    const task: Task = {
      // @ts-ignore
      processId,
      // @ts-ignore
      step,
      id,
      action: raw.action,
      target: {
        site: raw.target.site,
        url: raw.target.url ?? "",
      },
      selectorDescription: (raw as any).selectorDescription || "",
      selector: (raw as any).selector || "",
      params: raw.params || {},
      description: raw.description || "",
      status: "pending",
      subtasks: [],
    };

    if (raw.subtasks && raw.subtasks.length) {
      task.subtasks = raw.subtasks.map((st, i) => normalize(st, i + 1));
    }

    return task;
  }

  return planObj.tasks.map((t, i) => normalize(t, i + 1));
}
