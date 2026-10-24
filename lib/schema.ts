import { z } from "zod";

export const EvidenceKindSchema = z.enum(["log", "screen", "metric", "message"]);
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;

export const EvidenceItemSchema = z.object({
  kind: EvidenceKindSchema,
  label: z.string().min(1, "Evidence label is required"),
  content: z.string().min(1, "Evidence content is required"),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const OptionSchema = z.object({
  id: z.string().min(1, "Option ID is required"),
  text: z.string().min(1, "Option text is required"),
  is_best: z.boolean(),
  stability_delta: z.number().int(),
  outcome: z.string().min(1, "Outcome description is required"),
  why: z.string().min(1, "Explanation of outcome is required"),
});
export type Option = z.infer<typeof OptionSchema>;

export const DebriefSchema = z.object({
  concept: z.string().min(1, "Debrief concept is required"),
  rule_of_thumb: z.string().min(1, "Rule of thumb is required"),
  why_best_works: z.string().min(1, "Why best works is required"),
  real_world_note: z.string().min(1, "Real world note is required"),
  next_teaser: z.string().min(1, "Next teaser is required"),
});
export type Debrief = z.infer<typeof DebriefSchema>;

export const IncidentMetaSchema = z.object({
  id: z.string().min(1, "Incident ID is required"),
  order: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(1).max(5)),
  title: z.string().min(1, "Incident title is required"),
  setting: z.string().min(1, "Incident setting is required"),
  concept: z.string().min(1, "Incident concept is required"),
  difficulty: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(1).max(5)),
  hook: z.string().min(1, "Incident hook is required"),
});
export type IncidentMeta = z.infer<typeof IncidentMetaSchema>;

export const IncidentBaseSchema = IncidentMetaSchema.extend({
  alert: z.string().min(1, "Alert headline is required"),
  clock: z.string().min(1, "Clock line is required"),
  stakes_line: z.string().min(1, "Stakes line is required"),
  evidence: z.array(EvidenceItemSchema).length(3, "Must provide exactly 3 evidence items"),
  question: z.string().min(1, "Question is required"),
  options: z.array(OptionSchema).length(4, "Must provide exactly 4 options"),
  debrief: DebriefSchema,
});

export const IncidentSchema = IncidentBaseSchema.superRefine((data, ctx) => {
  const bestOptions = data.options.filter((opt) => opt.is_best);
  if (bestOptions.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Incident must have exactly 1 best option; found ${bestOptions.length}`,
      path: ["options"],
    });
  } else {
    const best = bestOptions[0];
    if (best.stability_delta < 25) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Best option must have stability_delta >= 25, got ${best.stability_delta}`,
        path: ["options", data.options.indexOf(best), "stability_delta"],
      });
    }
  }

  data.options.forEach((opt, idx) => {
    if (!opt.is_best && opt.stability_delta > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Non-best option must have stability_delta <= 15, got ${opt.stability_delta}`,
        path: ["options", idx, "stability_delta"],
      });
    }
  });
});
export type Incident = z.infer<typeof IncidentSchema>;

export const CaseFileSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  reframed_goal: z.union([z.string(), z.null()]).optional().transform((v) => (v === "null" ? null : v ?? null)),
  role: z.string().min(1, "Role is required"),
  tagline: z.string().min(1, "Tagline is required"),
  incidents: z.array(IncidentMetaSchema).length(5, "Case file must contain exactly 5 incidents"),
});
export type CaseFile = z.infer<typeof CaseFileSchema>;

export const FullCaseFileSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  reframed_goal: z.union([z.string(), z.null()]).optional().transform((v) => (v === "null" ? null : v ?? null)),
  role: z.string().min(1, "Role is required"),
  tagline: z.string().min(1, "Tagline is required"),
  incidents: z.array(IncidentSchema).length(5, "Full case file must contain exactly 5 full incidents"),
});
export type FullCaseFile = z.infer<typeof FullCaseFileSchema>;

export const IncidentResultSchema = z.object({
  incidentId: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  rewindsUsed: z.number().int().min(0),
  points: z.number().int().min(0),
  solvedFirstTry: z.boolean(),
});
export type IncidentResult = z.infer<typeof IncidentResultSchema>;

export const ReportRankSchema = z.enum(["Intern", "Analyst", "Lead", "Chief"]);
export type ReportRank = z.infer<typeof ReportRankSchema>;

export const ReportSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  role: z.string().min(1, "Role is required"),
  rank: ReportRankSchema,
  score: z.number().int().min(0),
  conceptsUnlocked: z.array(z.string().min(1)),
  verdict: z.string().min(1, "Verdict is required"),
  perfectCount: z.number().int().min(0),
  totalRewinds: z.number().int().min(0),
});
export type Report = z.infer<typeof ReportSchema>;

export const GameStateSchema = z.object({
  caseFile: CaseFileSchema.nullable(),
  currentIncident: IncidentBaseSchema.nullable(),
  currentIndex: z.number().int().min(0).max(4),
  tokens: z.number().int().min(0).max(3),
  score: z.number().int().min(0),
  stability: z.number().int().min(0).max(100),
  results: z.array(IncidentResultSchema),
  streak: z.number().int().min(0),
  lastPlayedDate: z.string().nullable(),
});
export type GameState = z.infer<typeof GameStateSchema>;
