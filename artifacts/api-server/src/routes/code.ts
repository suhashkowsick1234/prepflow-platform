import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { callGroqWithModelFallback, safeParseJson } from "./groq-client";
import { getFallbackCodeExample } from "./fallback-generators";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a principal software engineer and computer science educator. Return ONLY raw valid JSON. No markdown fences, no triple backticks.

CRITICAL CODE REQUIREMENTS:
1. You MUST generate FULL, WORKING, EXECUTABLE source code in 4 languages: Java, Python, C++, and JavaScript.
2. DO NOT use placeholders like "..." or "// code". Write complete function definitions, variables, loops/logic, and return statements.
3. Generate only the requested approach. Do not include other approaches.
4. Format all JSON fields cleanly.`;

const USER_PROMPT = (topic: string, approach: string) => {
  const approachTitle = approach === "bruteForce"
    ? "Brute Force / Naive"
    : approach === "betterApproach"
    ? "Better / Optimized"
    : "Optimal / Best";

  return `Generate coding examples and analysis for the topic or algorithm: "${topic}" using the "${approachTitle}" approach.

Return ONLY this JSON structure:
{
  "isProgramming": true,
  "description": "Comprehensive implementation and algorithm analysis for ${topic}",
  "problemStatement": "Given an input array/structure, solve the ${topic} problem. Input: ..., Output: ..., Constraints: ...",
  "${approach}": {
    "explanation": "High level description of how this specific approach works.",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "examples": [
      {
        "language": "JavaScript",
        "code": "function solve(nums, target) {\\n    // Full working JavaScript code\\n}",
        "explanation": "Walkthrough of JS solution"
      },
      {
        "language": "Python",
        "code": "def solve(nums: list[int], target: int) -> list[int]:\\n    # Full working Python code\\n    pass",
        "explanation": "Walkthrough of Python solution"
      },
      {
        "language": "Java",
        "code": "public class Solution {\\n    public static int[] solve(int[] nums, int target) {\\n        // Full working Java code\\n    }\\n}",
        "explanation": "Walkthrough of Java solution"
      },
      {
        "language": "C++",
        "code": "#include <vector>\\nusing namespace std;\\nvector<int> solve(vector<int>& nums, int target) {\\n    // Full working C++ code\\n}",
        "explanation": "Walkthrough of C++ solution"
      }
    ]
  }
}`;
};

function normalizeCode(parsed: any, topic: string, targetApproach: string): any {
  if (!parsed || typeof parsed !== "object") {
    return getFallbackCodeExample(topic, targetApproach);
  }

  const approachData = parsed[targetApproach] || parsed.optimalApproach || parsed.bruteForce || parsed.betterApproach;

  const examples = Array.isArray(approachData?.examples)
    ? approachData.examples.map((ex: any) => ({
        language: String(ex?.language || "JavaScript"),
        code: String(ex?.code || "// Code implementation"),
        explanation: String(ex?.explanation || ""),
      }))
    : [];

  if (examples.length === 0) {
    return getFallbackCodeExample(topic, targetApproach);
  }

  return {
    isProgramming: parsed.isProgramming ?? true,
    description: String(parsed.description || `Coding analysis for ${topic}`),
    problemStatement: String(parsed.problemStatement || `Implement and analyze ${topic}`),
    [targetApproach]: {
      explanation: String(approachData?.explanation || `Overview of ${targetApproach} for ${topic}`),
      timeComplexity: String(approachData?.timeComplexity || "O(N)"),
      spaceComplexity: String(approachData?.spaceComplexity || "O(1)"),
      examples,
    },
  };
}

router.post("/code", async (req, res): Promise<void> => {
  const { topic, approach } = req.body || {};
  if (typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ success: false, message: "Topic is required" });
    return;
  }

  const cleanTopic = topic.trim();
  const targetApproach = (approach === "bruteForce" || approach === "betterApproach" || approach === "optimalApproach")
    ? approach
    : "optimalApproach";

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.json({ codeExample: getFallbackCodeExample(cleanTopic, targetApproach) });
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const raw = await callGroqWithModelFallback(
      groq,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT(cleanTopic, targetApproach) },
      ],
      req.log,
      4000
    );

    const parsed = safeParseJson(raw, {});
    const codeExample = normalizeCode(parsed, cleanTopic, targetApproach);
    res.json({ codeExample });
  } catch (err: unknown) {
    if (req.log?.warn) {
      req.log.warn({ err }, "Code examples LLM call failed. Returning deterministic fallback.");
    }
    res.json({ codeExample: getFallbackCodeExample(cleanTopic, targetApproach) });
  }
});

export default router;
