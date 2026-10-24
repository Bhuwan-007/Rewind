import { CaseFile, Incident, FullCaseFileSchema } from "./schema";
import cybersecuritySeed from "./seed/cybersecurity.json";
import uiuxSeed from "./seed/uiux.json";

// In-memory rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const casefileRateLimits = new Map<string, RateLimitRecord>();
const incidentRateLimits = new Map<string, RateLimitRecord>();

const CASEFILE_MAX_PER_HOUR = 8;
const INCIDENT_MAX_PER_HOUR = 40;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function checkRateLimit(
  ip: string,
  type: "casefile" | "incident"
): { allowed: boolean; remaining: number } {
  const map = type === "casefile" ? casefileRateLimits : incidentRateLimits;
  const max = type === "casefile" ? CASEFILE_MAX_PER_HOUR : INCIDENT_MAX_PER_HOUR;
  const now = Date.now();

  const record = map.get(ip);
  if (!record || now > record.resetTime) {
    map.set(ip, { count: 1, resetTime: now + ONE_HOUR_MS });
    return { allowed: true, remaining: max - 1 };
  }

  if (record.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: max - record.count };
}

/**
 * Extracts client IP from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Caps goal at 80 chars, trims, and cleans whitespace/newlines.
 * Treats goal as pure data, not instructions.
 */
export function sanitizeGoal(raw: unknown): string {
  if (typeof raw !== "string") return "Cybersecurity";
  const trimmed = raw.trim().slice(0, 80);
  // Strip control characters and collapse whitespace
  const sanitized = trimmed.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ");
  return sanitized || "Cybersecurity";
}

/**
 * Normalizes goal string for cache lookup
 */
export function normalizeGoal(goal: string): string {
  return goal.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

// In-memory cache for case files
export const caseFileCache = new Map<string, CaseFile>();

// Validated seed cases
const parsedCyberSeed = FullCaseFileSchema.parse(cybersecuritySeed);
const parsedUiuxSeed = FullCaseFileSchema.parse(uiuxSeed);

const UI_KEYWORDS = ["ui", "ux", "design", "figma", "frontend", "interface", "usability", "wireframe", "css"];

export function isUiGoal(goal: string): boolean {
  const normalized = normalizeGoal(goal);
  return UI_KEYWORDS.some((kw) => normalized.includes(kw));
}

/**
 * Returns closest seeded case file, adapting the goal field to the user's input
 */
export function getFallbackCaseFile(goal: string): CaseFile {
  const source = isUiGoal(goal) ? parsedUiuxSeed : parsedCyberSeed;
  return {
    goal,
    reframed_goal: source.reframed_goal ?? null,
    role: source.role,
    tagline: source.tagline,
    incidents: source.incidents.map((inc) => ({
      id: inc.id,
      order: inc.order,
      title: inc.title,
      setting: inc.setting,
      concept: inc.concept,
      difficulty: inc.difficulty,
      hook: inc.hook,
    })),
  };
}

/**
 * Returns matching seeded incident by order (1..5)
 */
export function getFallbackIncident(goal: string, order: number): Incident {
  const source = isUiGoal(goal) ? parsedUiuxSeed : parsedCyberSeed;
  const clampedOrder = Math.max(1, Math.min(5, order));
  const found = source.incidents.find((inc) => inc.order === clampedOrder);
  return found || source.incidents[0];
}

/**
 * Executes an async task with a 20-second timeout
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 20000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
