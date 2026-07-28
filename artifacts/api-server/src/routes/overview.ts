import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert educational content generator. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate a high-level overview of the topic.
- Keep summary concise (2-3 sentences max).
- If topic involves programming/CS/algorithms, set isProgramming to true. Otherwise false.`;

const USER_PROMPT = (topic: string) => `Generate overview JSON for topic: "${topic}"

Return ONLY this JSON structure:
{
  "title": "${topic}",
  "description": "Short 1-2 sentence description",
  "estimatedStudyTime": "2-3 hours",
  "difficulty": "Intermediate",
  "summary": "2-3 concise sentences explaining what the topic is, why it matters, and core idea",
  "keyPoints": ["5-7 key takeaway bullet points"],
  "practiceTips": ["Actionable tip 1", "Actionable tip 2"],
  "isProgramming": true
}`;

function normalizeOverview(parsed: any, topic: string): any {
  return {
    title: String(parsed?.title || topic),
    description: String(parsed?.description || `Master the core concepts, principles, and applications of ${topic}.`),
    estimatedStudyTime: String(parsed?.estimatedStudyTime || "2-3 hours"),
    difficulty: ["Beginner", "Intermediate", "Advanced"].includes(parsed?.difficulty)
      ? parsed.difficulty
      : "Intermediate",
    summary: String(parsed?.summary || `${topic} is a key fundamental concept in computer science and software development.`),
    keyPoints: Array.isArray(parsed?.keyPoints) && parsed.keyPoints.length > 0
      ? parsed.keyPoints.map(String)
      : [
          `Understanding the core principles of ${topic}`,
          `Practical applications and industry standard practices`,
          `Performance considerations and time/space trade-offs`,
          `Common edge cases and debugging techniques`,
        ],
    practiceTips: Array.isArray(parsed?.practiceTips)
      ? parsed.practiceTips.map(String)
      : [`Practice building small projects with ${topic}`, `Review interview questions and code implementations`],
    isProgramming: Boolean(parsed?.isProgramming ?? true),
  };
}

router.post("/overview", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ success: false, message: "AI service not configured." });
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const raw = await callGroqWithModelFallback(
      groq,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT(topic.trim()) },
      ],
      req.log,
      2000
    );

    const parsed = safeParseJson(raw, {});
    const overview = normalizeOverview(parsed, topic.trim());
    res.json(overview);
  } catch (err: unknown) {
    const error = err as { status?: number };
    if (error?.status === 429) {
      res.status(429).json({ success: false, message: "Rate limit reached. Retry in a moment." });
    } else {
      res.status(500).json({ success: false, message: "Failed to generate overview." });
    }
  }
});

export default router;
