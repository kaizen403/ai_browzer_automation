// src/index.ts
import express from "express";
import "dotenv/config";
import { planTasks } from "./agent/planner";
import { Observer } from "./parser/observer";
const app = express();
const port = process.env.PORT || 3000;

// JSON bodies
app.use(express.json());

// Healthcheck
app.get("/", (req: any, res: any) => {
  res.send("🛠 Browser-AI Agent Backend up and running!");
});
app.post("/find-selector", async (req: any, res: any) => {
  const { url, description } = req.body as {
    url?: string;
    description?: string;
  };
  if (!url || !description) {
    return res
      .status(400)
      .json({ error: "Require JSON body with {url, description}" });
  }
  try {
    const obs = new Observer();
    const selector = await obs.findSelectorByDescription(url, description);
    return res.json({ selector });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
// Plan endpoint
app.post("/plan", (req: any, res: any) => {
  const prompt = req.body?.prompt;
  if (!prompt) {
    res.status(400).json({ error: 'Missing "prompt" in request body' });
    return;
  }
  planTasks(prompt)
    .then((tasks) => res.json(tasks))
    .catch((err: any) => {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    });
});

app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
