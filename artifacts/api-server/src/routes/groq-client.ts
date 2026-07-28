import Groq from "groq-sdk";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "deepseek-r1-distill-llama-70b",
];

/**
 * Advanced JSON Repair Utility:
 * Handles:
 * 1. DeepSeek / Reasoning models `<think>...</think>` tags
 * 2. Markdown code fences ```json ... ```
 * 3. Leading/trailing non-JSON commentary text
 * 4. Trailing commas before } or ]
 * 5. Truncated JSON structures (missing closing brackets/braces)
 */
export function repairJson(raw: string): string {
  if (!raw || typeof raw !== "string") return "{}";

  let cleaned = raw.trim();

  // 1. Remove reasoning/think tags
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Remove markdown code fences
  cleaned = cleaned.replace(/```(?:json)?\s*/gi, "").replace(/\s*```/g, "");

  // 3. Extract JSON object or array substring
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  if (startIdx !== -1) {
    const endChar = isArray ? "]" : "}";
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, lastIdx + 1);
    } else {
      cleaned = cleaned.slice(startIdx);
    }
  }

  // 4. Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // 5. Fix truncated JSON (unbalanced braces/brackets)
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === "\\") {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      if (char === "}") openBraces = Math.max(0, openBraces - 1);
      if (char === "[") openBrackets++;
      if (char === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  // Close unclosed strings
  if (inString) {
    cleaned += '"';
  }

  // Remove trailing comma if string ended on comma
  cleaned = cleaned.replace(/,\s*$/, "");

  // Balance brackets & braces
  while (openBrackets > 0) {
    cleaned += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    cleaned += "}";
    openBraces--;
  }

  return cleaned;
}

/**
 * Safe JSON parser with repair fallback.
 */
export function safeParseJson<T = any>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      const repaired = repairJson(raw);
      return JSON.parse(repaired);
    } catch {
      return fallback;
    }
  }
}

export async function callGroqWithModelFallback(
  groq: Groq,
  messages: Groq.Chat.ChatCompletionMessageParam[],
  logger: any,
  maxTokens = 3000
): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (logger?.info) {
          logger.info({ model, attempt }, "Requesting Groq completion");
        }
        const completion = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.5,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        });
        const content = completion.choices[0]?.message?.content ?? "";
        if (content.trim()) return content;
      } catch (err: unknown) {
        lastError = err;
        const error = err as { status?: number; message?: string };
        if (logger?.warn) {
          logger.warn({ model, attempt, status: error?.status, message: error?.message }, "Groq model call failed");
        }

        if (error?.status === 429) {
          break; // Cascade to next model on rate limit
        }

        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  throw lastError;
}
