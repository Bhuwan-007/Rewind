"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  getGameStateSnapshot,
  getServerSnapshot,
  subscribeToStore,
  initCaseState,
  resumeCase,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/store";
import { CaseFile, Incident } from "@/lib/schema";
import { rankForScore } from "@/lib/game";
import { Play, Check, Bookmark, ArrowRight, Trash2, Trophy, Clock } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function SkillsPage() {
  const router = useRouter();
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingGoal, setLoadingGoal] = useState("");

  const state = useSyncExternalStore(
    subscribeToStore,
    getGameStateSnapshot,
    getServerSnapshot
  );

  const cases = state.cases || [];
  const wishlist = state.wishlist || [];

  // Group cases
  const currentCases = cases.filter((c) => c.status !== "done");
  const learnedCases = cases.filter((c) => c.status === "done");

  // Handle starting a new skill case
  const handleStartSkill = async (targetGoal: string) => {
    const trimmed = targetGoal.trim();
    if (!trimmed) return;

    setLoading(true);
    setLoadingGoal(trimmed);
    setLoadingStepIndex(0);

    try {
      // 1. Generate or fetch CaseFile
      setLoadingStepIndex(1);
      const caseRes = await fetch("/api/casefile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });
      const caseFile: CaseFile = await caseRes.json();

      // 2. Fetch Incident 1
      setLoadingStepIndex(2);
      const firstMeta = caseFile.incidents[0];
      const incRes = await fetch("/api/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: caseFile.goal,
          role: caseFile.role,
          incident: firstMeta,
          difficulty: firstMeta.difficulty || 2,
          support_level: "normal",
        }),
      });
      const firstIncident: Incident = await incRes.json();

      // 3. If it was in wishlist, remove it
      removeFromWishlist(trimmed);

      // 4. Initialize new case in multi-case store & redirect
      initCaseState(caseFile, firstIncident);
      router.push("/case");
    } catch (err) {
      console.error("Failed to start skill:", err);
      router.push("/case");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForLater = () => {
    if (!newGoal.trim()) return;
    addToWishlist(newGoal);
    setNewGoal("");
  };

  return (
    <div className="min-h-screen bg-chalk text-ink flex flex-col">
      <Navbar />

      {loading && (
        <LoadingScreen
          fullscreen={true}
          goal={loadingGoal}
          step={loadingStepIndex}
          title="Rewinding the clock..."
          subtitle={`Simulating the worst day for ${loadingGoal}`}
        />
      )}

      <main className="flex-1 flex flex-col items-center px-4 pt-24 pb-20">
        <div className="w-full max-w-[760px] flex flex-col gap-8 text-left">
          {/* Header */}
          <div>
            <h1 className="font-display font-extrabold text-[36px] sm:text-[44px] leading-tight text-ink">
              Skills & Cases
            </h1>
            <p className="font-sans font-medium text-[16px] sm:text-[18px] text-mute mt-1">
              Start new emergency roadmaps, resume paused scenarios, and track learned capabilities.
            </p>
          </div>

          {/* Top Card: New Skill Input + Save for Later */}
          <div className="w-full bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 flex flex-col gap-4">
            <label
              htmlFor="skills-input"
              className="font-display font-bold text-[18px] sm:text-[20px] text-ink"
            >
              Learn a new skill
            </label>

            <input
              id="skills-input"
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value.slice(0, 80))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleStartSkill(newGoal);
                }
              }}
              disabled={loading}
              placeholder="e.g. Distributed Systems, Kubernetes, Cryptography, React..."
              className="w-full h-[56px] px-4 text-ink font-sans text-[18px] bg-paper border-[2.5px] border-ink rounded-[14px] focus:outline-none focus:ring-2 focus:ring-butter shadow-[2px_2px_0_#17171C] disabled:bg-stone/30"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="w-full sm:w-auto">
                <PrimaryButton
                  disabled={loading || !newGoal.trim()}
                  onClick={() => handleStartSkill(newGoal)}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-ink border-t-transparent rounded-full" />
                      Rewinding the clock...
                    </span>
                  ) : (
                    "Start case"
                  )}
                </PrimaryButton>
              </div>

              <button
                type="button"
                onClick={handleSaveForLater}
                disabled={!newGoal.trim() || loading}
                className="font-sans font-semibold text-[15px] text-mute hover:text-ink underline disabled:opacity-40 cursor-pointer py-1"
              >
                Save for later
              </button>
            </div>
          </div>

          {/* Section 1: Current Cases (Active & Paused) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-[22px] sm:text-[24px] text-ink">
                Current Cases
              </h2>
              <span className="font-mono text-[13px] font-semibold text-mute">
                {currentCases.length} in progress
              </span>
            </div>

            {currentCases.length === 0 ? (
              <div className="bg-paper/60 border-[2px] border-dashed border-ink/40 rounded-[16px] p-6 text-center text-mute font-sans text-[15px]">
                No cases in progress. Enter a skill above to start your first case.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentCases.map((c) => {
                  const isActive = c.id === state.activeCaseId || c.status === "active";
                  return (
                    <div
                      key={c.id}
                      className="bg-paper border-[2.5px] border-ink rounded-[16px] shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-9 h-9 rounded-full border-[2px] border-ink flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isActive ? "bg-butter text-ink" : "bg-stone/40 text-mute"
                          }`}
                        >
                          <Play className="w-4 h-4 fill-ink" strokeWidth={2.5} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-[18px] sm:text-[20px] text-ink">
                              {c.goal}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider border-[1.5px] border-ink ${
                                isActive ? "bg-seafoam text-ink" : "bg-stone/50 text-mute"
                              }`}
                            >
                              {isActive ? "Active" : "Paused"}
                            </span>
                          </div>
                          <div className="font-mono text-[13px] text-mute font-medium mt-1">
                            {c.results.length} of 5 incidents done · {c.score} pts
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          resumeCase(c.id);
                          router.push("/case");
                        }}
                        className="px-5 py-2 bg-butter hover:bg-butter/90 border-[2px] border-ink rounded-full font-sans font-bold text-[14px] text-ink shadow-[2px_2px_0_#17171C] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer self-start sm:self-auto"
                      >
                        Resume
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Learned Cases */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-[22px] sm:text-[24px] text-ink">
                Learned Skills
              </h2>
              <span className="font-mono text-[13px] font-semibold text-mute">
                {learnedCases.length} completed
              </span>
            </div>

            {learnedCases.length === 0 ? (
              <div className="bg-paper/60 border-[2px] border-dashed border-ink/40 rounded-[16px] p-6 text-center text-mute font-sans text-[15px]">
                Complete all 5 incidents of a crisis scenario to record your mastered skills.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {learnedCases.map((c) => {
                  const rank = rankForScore(c.score);
                  return (
                    <div
                      key={c.id}
                      className="bg-paper border-[2.5px] border-ink rounded-[16px] shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-seafoam border-[2px] border-ink flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-ink" strokeWidth={2.5} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-display font-bold text-[18px] sm:text-[20px] text-ink">
                              {c.goal}
                            </span>
                            <span className="bg-butter border-[1.5px] border-ink rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink uppercase tracking-wide">
                              Rank: {rank}
                            </span>
                          </div>
                          <div className="font-mono text-[13px] text-mute font-medium mt-0.5">
                            Final Score: {c.score} / 500
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/curve?case=${c.id}`)}
                        className="px-4 py-1.5 bg-frost hover:bg-frost/90 border-[2px] border-ink rounded-full font-sans font-bold text-[14px] text-ink shadow-[2px_2px_0_#17171C] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>View curve</span>
                        <ArrowRight className="w-4 h-4 text-ink" strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Wishlist */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-[22px] sm:text-[24px] text-ink">
                Wishlist
              </h2>
              <span className="font-mono text-[13px] font-semibold text-mute">
                {wishlist.length} saved
              </span>
            </div>

            {wishlist.length === 0 ? (
              <div className="bg-paper/60 border-[2px] border-dashed border-ink/40 rounded-[16px] p-6 text-center text-mute font-sans text-[15px]">
                No skills queued. Type any topic and click &ldquo;Save for later&rdquo; to build your wishlist.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {wishlist.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-paper border-[2px] border-ink rounded-[14px] shadow-[2px_2px_0_#17171C] px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bookmark className="w-4 h-4 text-mute flex-shrink-0" strokeWidth={2.5} />
                      <span className="font-sans font-bold text-[16px] text-ink truncate">
                        {item}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartSkill(item)}
                        className="px-3.5 py-1 bg-butter hover:bg-butter/90 border-[1.5px] border-ink rounded-full font-sans font-bold text-[13px] text-ink shadow-[1px_1px_0_#17171C] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item)}
                        title="Remove from wishlist"
                        className="p-1 text-mute hover:text-flamingo transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
