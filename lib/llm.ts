import { z } from "zod";

export interface CallLLMParams<T extends z.ZodTypeAny> {
  system: string;
  user: string;
  schema: T;
  signal?: AbortSignal;
}

/**
 * Strips markdown code fences (```json ... ``` or ``` ... ```) if present.
 */
export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Normalizes common variations in LLM JSON output to match schema requirements
 */
function normalizeLlmOutput(parsed: unknown): unknown {
  if (typeof parsed !== "object" || parsed === null) return parsed;
  const obj = { ...(parsed as Record<string, unknown>) };

  // CaseFile normalization
  if (!obj.goal && typeof obj.skill === "string") {
    obj.goal = obj.skill;
  }
  if (!obj.role) {
    obj.role = "Lead Specialist";
  }
  if (!obj.tagline) {
    obj.tagline = "Five bad days. One better you.";
  }
  if (!obj.incidents && (Array.isArray(obj.case_file) || Array.isArray(obj.casefile))) {
    obj.incidents = obj.case_file || obj.casefile;
  }

  if (Array.isArray(obj.incidents)) {
    obj.incidents = obj.incidents.map((inc: Record<string, unknown>, idx: number) => {
      if (typeof inc !== "object" || inc === null) return inc;
      const normalizedInc = { ...inc };
      if (!normalizedInc.id && normalizedInc.incident_id) {
        normalizedInc.id = normalizedInc.incident_id;
      }
      if (!normalizedInc.id) {
        normalizedInc.id = `inc_${idx + 1}`;
      }
      if (typeof normalizedInc.order !== "number") {
        normalizedInc.order = idx + 1;
      }
      if (!normalizedInc.concept && normalizedInc.core_concept) {
        normalizedInc.concept = normalizedInc.core_concept;
      }
      if (!normalizedInc.hook) {
        normalizedInc.hook =
          typeof normalizedInc.challenge === "string"
            ? normalizedInc.challenge
            : typeof normalizedInc.scenario === "string"
            ? normalizedInc.scenario.slice(0, 80)
            : String(normalizedInc.title || `Incident ${idx + 1}`);
      }
      return normalizedInc;
    });
  }

  return obj;
}

/**
 * Calls the Gemini API with JSON output mode, parses response, strips code fences,
 * validates against provided zod schema, and retries once on failure.
 */
export async function callLLM<T extends z.ZodTypeAny>({
  system,
  user,
  schema,
  signal,
}: CallLLMParams<T>): Promise<z.infer<T>> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is not set");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: user }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      // thinkingBudget: 0 disables extended reasoning latency on Gemini 2.5 Flash, responding in ~2-4s
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  async function executeSingleAttempt(attemptNum: number): Promise<z.infer<T>> {
    let rawText = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Gemini API error (HTTP ${res.status} ${res.statusText}): ${errText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new Error("Gemini returned no candidates in response");
      }

      rawText = candidate.content?.parts?.[0]?.text;
      if (typeof rawText !== "string") {
        throw new Error("Gemini response missing text in candidates[0].content.parts[0]");
      }

      const cleanedText = stripCodeFences(rawText);
      const parsedJson = JSON.parse(cleanedText);
      const normalized = normalizeLlmOutput(parsedJson);
      const validated = schema.parse(normalized);
      return validated;
    } catch (err) {
      console.warn(`[Attempt ${attemptNum}] LLM validation/parse error:`, err);
      if (rawText) {
        console.warn(`[Attempt ${attemptNum}] Raw model text was:`, rawText);
      }
      throw err;
    }
  }

  // Attempt 1
  try {
    return await executeSingleAttempt(1);
  } catch (firstError) {
    console.warn("First LLM call attempt failed, retrying once:", firstError);

    // If abort was requested by parent, check before retrying
    if (signal?.aborted) {
      throw firstError;
    }

    // Attempt 2 (retry once)
    try {
      return await executeSingleAttempt(2);
    } catch (secondError) {
      console.error("Second LLM call attempt failed:", secondError);
      throw secondError;
    }
  }
}
