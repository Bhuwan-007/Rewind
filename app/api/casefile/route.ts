import { NextResponse } from "next/server";
import { CaseFileSchema } from "@/lib/schema";
import { callLLM } from "@/lib/llm";
import { PROMPT_1_SYSTEM, formatPrompt1User } from "@/lib/prompts";
import {
  getClientIp,
  checkRateLimit,
  sanitizeGoal,
  normalizeGoal,
  caseFileCache,
  getFallbackCaseFile,
  withTimeout,
} from "@/lib/protection";

export async function POST(req: Request) {
  let goal = "Cybersecurity";

  try {
    const body = await req.json().catch(() => ({}));
    goal = sanitizeGoal(body?.goal);
    const normalized = normalizeGoal(goal);

    // 1. Check in-memory cache
    if (caseFileCache.has(normalized)) {
      return NextResponse.json(caseFileCache.get(normalized));
    }

    // 2. Per-IP rate limiting (8 case files per hour)
    const ip = getClientIp(req);
    const rate = checkRateLimit(ip, "casefile");
    if (!rate.allowed) {
      console.warn(`Rate limit reached for IP ${ip} on casefile; falling back to seed`);
      return NextResponse.json(getFallbackCaseFile(goal));
    }

    // 3. Fallback if API key missing
    if (!process.env.LLM_API_KEY) {
      console.warn("LLM_API_KEY not configured; serving fallback seed case file");
      return NextResponse.json(getFallbackCaseFile(goal));
    }

    // 4. Generate with 20s timeout and retry
    const caseFile = await withTimeout(async (signal) => {
      return await callLLM({
        system: PROMPT_1_SYSTEM,
        user: formatPrompt1User(goal),
        schema: CaseFileSchema,
        signal,
      });
    }, 20000);

    // 5. Store in cache and return
    caseFileCache.set(normalized, caseFile);
    return NextResponse.json(caseFile);
  } catch (err) {
    console.error("Casefile generation error, falling back to seed case:", err);
    return NextResponse.json(getFallbackCaseFile(goal));
  }
}
