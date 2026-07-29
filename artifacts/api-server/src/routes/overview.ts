import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackOverview, validateTopicRelevance } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a principal software engineer and computer science educator. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate a comprehensive overview and executive summary for the requested topic.
- Executive summary MUST contain 6-8 detailed paragraphs covering definition, core mechanics, real-world applications, interview importance, common pitfalls, and architectural trade-offs.
- Key points MUST contain 8-12 actionable takeaway points.
- If topic involves programming/CS/algorithms, set isProgramming to true.`;

const USER_PROMPT = (topic: string) => `Generate comprehensive overview and executive summary JSON specifically for topic: "${topic}"

Return ONLY this JSON structure:
{
  "title": "${topic}",
  "description": "Comprehensive learning guide and architectural overview for ${topic}",
  "estimatedStudyTime": "3-4 hours",
  "difficulty": "Intermediate",
  "summary": "Paragraph 1: Definition\\n\\nParagraph 2: Why it matters\\n\\nParagraph 3: Core mechanics\\n\\nParagraph 4: Industry applications\\n\\nParagraph 5: Technical interview importance\\n\\nParagraph 6: Common pitfalls and anti-patterns",
  "keyPoints": [
    "Core Mechanics: ...",
    "Algorithmic Efficiency: ...",
    "State Management: ...",
    "Scalability: ...",
    "Guardrails: ...",
    "Style Guide: ...",
    "Edge Cases: ...",
    "Testing: ...",
    "Interview Readiness: ..."
  ],
  "practiceTips": ["Actionable tip 1", "Actionable tip 2"],
  "isProgramming": true
}`;

function normalizeOverview(parsed: any, topic: string): any {
  if (!parsed || typeof parsed !== "object") {
    return getFallbackOverview(topic);
  }

  const result = {
    title: String(parsed?.title || topic),
    description: String(parsed?.description || `Master the core concepts, principles, and applications of ${topic}.`),
    estimatedStudyTime: String(parsed?.estimatedStudyTime || "3-4 hours"),
    difficulty: ["Beginner", "Intermediate", "Advanced"].includes(parsed?.difficulty)
      ? parsed.difficulty
      : "Intermediate",
    summary: String(parsed?.summary || `${topic} is a fundamental concept in computer science and software development.`),
    keyPoints: Array.isArray(parsed?.keyPoints) && parsed.keyPoints.length >= 5
      ? parsed.keyPoints.map(String)
      : getFallbackOverview(topic).keyPoints,
    practiceTips: Array.isArray(parsed?.practiceTips)
      ? parsed.practiceTips.map(String)
      : [`Practice building production systems with ${topic}`, `Review interview questions and code implementations`],
    isProgramming: Boolean(parsed?.isProgramming ?? true),
  };

  if (!validateTopicRelevance(result, topic)) {
    return getFallbackOverview(topic);
  }

  return result;
}

router.post("/overview", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json(getFallbackOverview(cleanTopic));
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
      3000
    );

    const parsed = safeParseJson(raw, {});
    const overview = normalizeOverview(parsed, cleanTopic);
    res.json(overview);
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Overview LLM call failed. Returning deterministic fallback.");
    }
    res.json(getFallbackOverview(cleanTopic));
  }
});

export default router;
