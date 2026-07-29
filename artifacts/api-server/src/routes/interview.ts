import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackInterviewQuestions, validateTopicRelevance } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert technical interviewer. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate 10-15 interview questions specifically for the topic.
- First question MUST ALWAYS be "What is <topic>?" with complete definition, applications, advantages, and limitations.
- difficulty: "easy" | "medium" | "hard"
- category: "basic" | "intermediate" | "advanced" | "scenario" | "hr" | "coding"`;

const USER_PROMPT = (topic: string, existing: string[]) => {
  const excludeText = existing.length > 0
    ? `\nDo NOT repeat these questions:\n${existing.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  return `Generate interview questions specifically for topic: "${topic}"${excludeText}

Return ONLY this JSON structure:
{
  "interviewQuestions": [
    {
      "question": "What is ${topic}?",
      "answer": "Comprehensive answer explaining definition, key applications, pros and cons of ${topic}.",
      "difficulty": "easy",
      "category": "basic"
    }
  ]
}`;
};

function normalizeInterview(parsed: any, topic: string): any[] {
  let list = Array.isArray(parsed?.interviewQuestions)
    ? parsed.interviewQuestions
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : Array.isArray(parsed)
    ? parsed
    : [];

  const normalized = list
    .filter((q: any) => q && typeof q === "object")
    .map((q: any, idx: number) => ({
      question: String(q.question || q.title || `Interview Question ${idx + 1} regarding ${topic}`),
      answer: String(q.answer || q.solution || q.explanation || `Comprehensive explanation and discussion on ${topic}.`),
      difficulty: ["easy", "medium", "hard"].includes(String(q.difficulty).toLowerCase())
        ? String(q.difficulty).toLowerCase()
        : "medium",
      category: String(q.category || "basic"),
    }));

  if (normalized.length > 0 && validateTopicRelevance(normalized, topic)) {
    return normalized;
  }
  return getFallbackInterviewQuestions(topic);
}

router.post("/interview", async (req, res): Promise<void> => {
  const { topic, existingQuestions } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const existing = Array.isArray(existingQuestions) ? existingQuestions : [];
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ interviewQuestions: getFallbackInterviewQuestions(cleanTopic) });
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const raw = await callGroqWithModelFallback(
      groq,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT(cleanTopic, existing) },
      ],
      req.log,
      3000
    );

    const parsed = safeParseJson(raw, {});
    const interviewQuestions = normalizeInterview(parsed, cleanTopic);
    res.json({ interviewQuestions });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Interview questions LLM call failed. Returning deterministic fallback.");
    }
    res.json({ interviewQuestions: getFallbackInterviewQuestions(cleanTopic) });
  }
});

export default router;
