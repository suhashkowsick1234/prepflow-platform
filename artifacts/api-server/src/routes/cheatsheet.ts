import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackCheatSheet } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a technical editor writing revision cheat sheets. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate 5 cheat sheet sections.
- Each section must have 5-8 short, crisp, interview-friendly revision bullet points.`;

const USER_PROMPT = (topic: string) => `Generate 5 cheat sheet sections for: "${topic}"

Return ONLY this JSON structure:
{
  "cheatSheet": [
    {
      "category": "Section Name",
      "points": ["Short revision bullet point 1", "Short revision bullet point 2"]
    }
  ]
}`;

function normalizeCheatSheet(parsed: any, topic: string): any[] {
  let list = Array.isArray(parsed?.cheatSheet)
    ? parsed.cheatSheet
    : Array.isArray(parsed?.sections)
    ? parsed.sections
    : Array.isArray(parsed)
    ? parsed
    : [];

  const normalized = list
    .filter((sec: any) => sec && typeof sec === "object")
    .map((sec: any, idx: number) => ({
      category: String(sec.category || sec.title || sec.name || `Section ${idx + 1}`),
      points: Array.isArray(sec.points)
        ? sec.points.map(String)
        : Array.isArray(sec.bullets)
        ? sec.bullets.map(String)
        : [`Core takeaways and summary points for ${topic}`],
    }));

  if (normalized.length > 0) return normalized;
  return getFallbackCheatSheet(topic);
}

router.post("/cheatsheet", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ cheatSheet: getFallbackCheatSheet(cleanTopic) });
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const raw = await callGroqWithModelFallback(
      groq,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT(cleanTopic) },
      ],
      req.log,
      2500
    );

    const parsed = safeParseJson(raw, {});
    const cheatSheet = normalizeCheatSheet(parsed, cleanTopic);
    res.json({ cheatSheet });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Cheat sheet LLM call failed. Returning deterministic fallback.");
    }
    res.json({ cheatSheet: getFallbackCheatSheet(cleanTopic) });
  }
});

export default router;
