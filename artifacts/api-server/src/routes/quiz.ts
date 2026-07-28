import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackQuiz } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert quiz generator. Return ONLY raw valid JSON. No markdown fences.
Rules:
- Generate 10-12 MCQs for the requested topic.
- Each question MUST have: question text, 4 distinct options, correctIndex (0-3), and detailed explanation.`;

const USER_PROMPT = (topic: string) => `Generate 10-12 MCQs for topic: "${topic}"

Return ONLY this JSON structure:
{
  "quiz": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation why Option A is correct"
    }
  ]
}`;

function normalizeQuiz(parsed: any, topic: string): any[] {
  let list = Array.isArray(parsed?.quiz)
    ? parsed.quiz
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : Array.isArray(parsed?.mcqs)
    ? parsed.mcqs
    : Array.isArray(parsed)
    ? parsed
    : [];

  const normalized = list
    .filter((q: any) => q && typeof q === "object")
    .map((q: any, idx: number) => {
      const options = Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map(String)
        : ["Option A", "Option B", "Option C", "Option D"];

      let correctIndex = Number(q.correctIndex ?? q.answerIndex ?? 0);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      return {
        question: String(q.question || q.title || `Question ${idx + 1} on ${topic}`),
        options,
        correctIndex,
        explanation: String(q.explanation || q.reason || `Option ${options[correctIndex]} is the correct answer based on standard concepts.`),
      };
    });

  if (normalized.length > 0) return normalized;
  return getFallbackQuiz(topic);
}

router.post("/quiz", async (req, res): Promise<void> => {
  const { topic } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ quiz: getFallbackQuiz(cleanTopic) });
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
    const quiz = normalizeQuiz(parsed, cleanTopic);
    res.json({ quiz });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Quiz LLM call failed. Returning deterministic fallback.");
    }
    res.json({ quiz: getFallbackQuiz(cleanTopic) });
  }
});

export default router;
