import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackRelatedTopics, validateTopicRelevance } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a learning path curator. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate 8-10 semantically related topics for study specifically for the requested topic.`;

const USER_PROMPT = (topic: string) => `Generate 8-10 semantically related topics for: "${topic}"

Return ONLY this JSON structure:
{
  "relatedTopics": ["Related Topic 1", "Related Topic 2", "Related Topic 3"]
}`;

function normalizeRelated(parsed: any, topic: string): string[] {
  let list = Array.isArray(parsed?.relatedTopics)
    ? parsed.relatedTopics
    : Array.isArray(parsed?.topics)
    ? parsed.topics
    : Array.isArray(parsed)
    ? parsed
    : [];

  const strings = list
    .map((item: any) => (typeof item === "string" ? item : item?.title || item?.name || ""))
    .filter(Boolean);

  if (strings.length > 0 && validateTopicRelevance(strings, topic)) {
    return strings;
  }
  return getFallbackRelatedTopics(topic);
}

router.post("/related", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ relatedTopics: getFallbackRelatedTopics(cleanTopic) });
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
      1500
    );

    const parsed = safeParseJson(raw, {});
    const relatedTopics = normalizeRelated(parsed, cleanTopic);
    res.json({ relatedTopics });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Related topics LLM call failed. Returning deterministic fallback.");
    }
    res.json({ relatedTopics: getFallbackRelatedTopics(cleanTopic) });
  }
});

export default router;
