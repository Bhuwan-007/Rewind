import { NextResponse } from "next/server";
import { ReportSchema } from "@/lib/schema";
import { callLLM } from "@/lib/llm";
import { PROMPT_3_SYSTEM, PROMPT_3_USER } from "@/lib/prompts";
import { sanitizeGoal, withTimeout } from "@/lib/protection";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const goal = sanitizeGoal(body?.goal);
    const role = typeof body?.role === "string" ? body.role : "Practitioner";
    const rank = typeof body?.rank === "string" ? body.rank : "Intern";
    const score = typeof body?.score === "number" ? body.score : 0;
    const results = Array.isArray(body?.results) ? body.results : [];

    const perfectCount = results.filter((r: { rewindsUsed: number }) => r.rewindsUsed === 0).length;
    const pointsList = results.map((r: { points: number }) => r.points).join(", ");
    const rewindsList = results.map((r: { rewindsUsed: number }) => r.rewindsUsed).join(", ");
    const conceptsList = Array.isArray(body?.concepts) ? body.concepts.join(", ") : "None";

    const userPrompt = PROMPT_3_USER
      .replace("{{goal}}", goal)
      .replace("{{role}}", role)
      .replace("{{rank}}", rank)
      .replace("{{score}}", String(score))
      .replace("{{perfect_count}}", String(perfectCount))
      .replace("{{points_list}}", pointsList || "None")
      .replace("{{rewinds_list}}", rewindsList || "None")
      .replace("{{concepts_list}}", conceptsList);

    if (process.env.LLM_API_KEY) {
      try {
        const reportCard = await withTimeout(async (signal) => {
          return await callLLM({
            system: PROMPT_3_SYSTEM,
            user: userPrompt,
            schema: ReportSchema,
            signal,
          });
        }, 15000);
        return NextResponse.json(reportCard);
      } catch (err) {
        console.warn("Report LLM generation failed, using static report fallback:", err);
      }
    }

    // Static fallback report
    const fallbackReport = {
      goal,
      role,
      rank,
      score,
      conceptsUnlocked: Array.isArray(body?.concepts) ? body.concepts : ["Core decision fundamentals"],
      verdict: `Successfully navigated the timeline under high-stakes pressure to secure the objective.`,
      perfectCount,
      totalRewinds: results.reduce((sum: number, r: { rewindsUsed: number }) => sum + (r.rewindsUsed || 0), 0),
    };

    return NextResponse.json(fallbackReport);
  } catch (error) {
    console.error("Report route unexpected error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
