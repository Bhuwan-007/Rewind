import type { ReportRank } from "./schema";

/**
 * Clamps stability between 0 and 100 after applying an option's stability delta.
 */
export function applyChoice(currentStability: number, delta: number): number {
  return Math.max(0, Math.min(100, currentStability + delta));
}

/**
 * Calculates score earned for an incident based on rewinds used.
 * - 0 rewinds: 100 points
 * - 1 rewind: 60 points
 * - 2+ rewinds: 30 points
 */
export function scoreForRewinds(rewindsUsed: number): number {
  if (rewindsUsed <= 0) return 100;
  if (rewindsUsed === 1) return 60;
  return 30;
}

/**
 * Pure adaptive difficulty rule (P1):
 * - 0 rewinds: next difficulty +1 (max 5)
 * - 1 rewind: next difficulty +0
 * - 2+ rewinds: next difficulty -1 (min 1)
 */
export function nextDifficulty(currentDifficulty: number, rewindsUsed: number): number {
  if (rewindsUsed <= 0) {
    return Math.min(5, currentDifficulty + 1);
  }
  if (rewindsUsed === 1) {
    return Math.max(1, Math.min(5, currentDifficulty));
  }
  return Math.max(1, currentDifficulty - 1);
}

/**
 * Forgiving streak calculation:
 * - If lastPlayedDate is null: sets streak to 1.
 * - If lastPlayedDate is today: streak remains unchanged.
 * - If lastPlayedDate was yesterday (1 calendar day ago): increments streak by 1.
 * - If lastPlayedDate was exactly 2 days ago: auto-forgiven as a "rest day", streak is kept and increments by 1.
 * - If 3+ days ago: streak resets to 1.
 */
export function updateStreak(
  lastPlayedDate: string | null,
  todayDate: string = new Date().toISOString().slice(0, 10),
  currentStreak: number = 0
): { streak: number; lastPlayedDate: string } {
  if (!lastPlayedDate) {
    return { streak: 1, lastPlayedDate: todayDate };
  }

  const [lastY, lastM, lastD] = lastPlayedDate.split("-").map(Number);
  const [todayY, todayM, todayD] = todayDate.split("-").map(Number);

  const lastUtc = Date.UTC(lastY, lastM - 1, lastD);
  const todayUtc = Date.UTC(todayY, todayM - 1, todayD);

  const diffMs = todayUtc - lastUtc;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { streak: Math.max(1, currentStreak), lastPlayedDate: todayDate };
  }

  if (diffDays === 1 || diffDays === 2) {
    // Consecutive or forgiven rest day
    return { streak: Math.max(0, currentStreak) + 1, lastPlayedDate: todayDate };
  }

  // 3+ days missed: reset to 1
  return { streak: 1, lastPlayedDate: todayDate };
}

/**
 * Case rank thresholds based on total score at case end:
 * < 200: Intern
 * 200 - 299: Analyst
 * 300 - 399: Lead
 * 400+: Chief
 */
export function rankForScore(totalScore: number): ReportRank {
  if (totalScore < 200) return "Intern";
  if (totalScore <= 299) return "Analyst";
  if (totalScore <= 399) return "Lead";
  return "Chief";
}
