import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackFlashcards, validateTopicRelevance } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert educator. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate EXACTLY 12 high-quality topic-specific flashcards for the requested topic.
- Front: crisp term or question.
- Back: clear, precise definition or answer.
- difficulty: "easy" | "medium" | "hard"
- category: section name (e.g. "Core Concepts", "Internals", "Performance", "Trade-offs", "Edge Cases")`;

const USER_PROMPT = (topic: string) => `Generate 12 topic-specific flashcards specifically for: "${topic}"

Return ONLY this JSON structure:
{
  "flashcards": [
    {"front": "Question about ${topic}?", "back": "Clear answer specifically for ${topic}", "difficulty": "medium", "category": "Core Concepts"}
  ]
}`;

function normalizeFlashcards(parsed: any, topic: string): any[] {
  let list = Array.isArray(parsed?.flashcards)
    ? parsed.flashcards
    : Array.isArray(parsed?.cards)
    ? parsed.cards
    : Array.isArray(parsed)
    ? parsed
    : [];

  const normalized = list
    .filter((item: any) => item && typeof item === "object")
    .map((item: any, idx: number) => ({
      front: String(item.front || item.question || item.term || `Key Concept ${idx + 1}`),
      back: String(item.back || item.answer || item.definition || `Essential details about ${topic}`),
      difficulty: ["easy", "medium", "hard"].includes(String(item.difficulty).toLowerCase())
        ? String(item.difficulty).toLowerCase()
        : "medium",
      category: String(item.category || "Core Concepts"),
    }));

  if (normalized.length > 0 && validateTopicRelevance(normalized, topic)) {
    return normalized;
  }
  return getFallbackFlashcards(topic);
}

router.post("/flashcards", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ flashcards: getFallbackFlashcards(cleanTopic) });
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
    const flashcards = normalizeFlashcards(parsed, cleanTopic);
    res.json({ flashcards });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Flashcards LLM call failed. Returning deterministic fallback.");
    }
    res.json({ flashcards: getFallbackFlashcards(cleanTopic) });
  }
});

export default router;
