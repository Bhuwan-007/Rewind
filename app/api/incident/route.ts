import { NextResponse } from "next/server";
import { IncidentSchema } from "@/lib/schema";
import { callLLM } from "@/lib/llm";
import { PROMPT_2_SYSTEM, formatPrompt2User } from "@/lib/prompts";
import {
  getClientIp,
  checkRateLimit,
  sanitizeGoal,
  getFallbackIncident,
  withTimeout,
} from "@/lib/protection";

export async function POST(req: Request) {
  let goal = "Cybersecurity";
  let order = 1;

  try {
    const body = await req.json().catch(() => ({}));
    goal = sanitizeGoal(body?.goal);
    order = typeof body?.incident?.order === "number" ? body.incident.order : 1;

    // 1. Per-IP rate limiting (40 incidents per hour)
    const ip = getClientIp(req);
    const rate = checkRateLimit(ip, "incident");
    if (!rate.allowed) {
      console.warn(`Rate limit reached for IP ${ip} on incident; returning seed incident`);
      return NextResponse.json(getFallbackIncident(goal, order));
    }

    // 2. Fallback if API key missing
    if (!process.env.LLM_API_KEY) {
      console.warn("LLM_API_KEY not configured; serving fallback seed incident");
      return NextResponse.json(getFallbackIncident(goal, order));
    }

    // 3. Format user prompt
    const previousConcepts = Array.isArray(body?.previous_concepts)
      ? body.previous_concepts.join(", ")
      : typeof body?.previous_concepts === "string"
      ? body.previous_concepts
      : "None";

    const promptUserText = formatPrompt2User({
      goal,
      role: typeof body?.role === "string" ? body.role : "Lead Responder",
      incident: {
        id: body?.incident?.id || `inc_${order}`,
        order,
        title: body?.incident?.title || "Crisis Containment",
        setting: body?.incident?.setting || "Operational Infrastructure",
        concept: body?.incident?.concept || "Immediate containment",
      },
      difficulty: typeof body?.difficulty === "number" ? Math.max(1, Math.min(5, body.difficulty)) : 2,
      support_level: body?.support_level === "high" ? "high" : "normal",
      previous_concepts: previousConcepts,
    });

    // 4. Generate incident with 20s timeout and retry
    const incident = await withTimeout(async (signal) => {
      return await callLLM({
        system: PROMPT_2_SYSTEM,
        user: promptUserText,
        schema: IncidentSchema,
        signal,
      });
    }, 20000);

    return NextResponse.json(incident);
  } catch (err) {
    console.error("Incident generation error, falling back to seed incident:", err);
    return NextResponse.json(getFallbackIncident(goal, order));
  }
}
