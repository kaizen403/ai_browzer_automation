// src/agent/types.ts

/** Atomic status values for a Task at runtime */
export type TaskStatus = "pending" | "running" | "success" | "error";

/**
 * The raw shape we expect Groq to emit in its JSON response.
 * All fields here are optional on entry, since IDs/status
 * will be filled in by us.
 */
export interface RawTask {
  id?: string;
  action: string;
  target: {
    site: string;
    selector?: string;
    url?: string;
  };
  params?: Record<string, unknown>;
  description?: string;
  subtasks?: RawTask[];
}

/** A full-fledged Task, ready for execution and UI binding */
// src/agent/types.ts

export interface Task {
  processId: string; // same for all tasks in this batch
  step: number; // 1, 2, 3, …
  id: string; // unique per task
  action: string; // e.g. "open", "search", "play"
  target: {
    site: string; // e.g. "Spotify"
    url?: string; // for navigate/open actions
  };
  selectorDescription?: string; // e.g. "the search input box"
  selector?: string; // left blank until observed
  params: Record<string, unknown>; // e.g. { query: "Lean On" }
  description?: string; // human-friendly summary
  subtasks?: Task[]; // nested, with their own steps if needed
  status: TaskStatus; // "pending" | "running" | …
}

/** The top-level JSON plan is simply an array of RawTasks */
export type RawPlan = RawTask[];
