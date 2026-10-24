"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  initCaseState,
  resumeCase,
  getGameStateSnapshot,
  getServerSnapshot,
  subscribeToStore,
} from "@/lib/store";
import { CaseFile, Incident } from "@/lib/schema";
import { Clock, Rewind, Check, Play } from "lucide-react";

const EXAMPLE_CHIPS = ["Cybersecurity", "UI/UX", "SQL", "DevOps"];

export default function Home() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Rewinding the clock...");

  const gameState = useSyncExternalStore(
    subscribeToStore,
    getGameStateSnapshot,
    getServerSnapshot
  );

  const resumableCase =
    gameState.cases?.find((c) => c.id === gameState.activeCaseId && c.status !== "done") ||
    gameState.cases?.find((c) => c.status === "active") ||
    gameState.cases?.find((c) => c.status === "paused") ||
    null;

  const handleStartCase = async (selectedGoal?: string) => {
    const targetGoal = (selectedGoal || goal || "Cybersecurity").trim();
    if (!targetGoal) return;

    setLoading(true);
    setLoadingStep("Rewinding the clock...");

    try {
      // 1. Generate or fetch CaseFile
      setLoadingStep("Assembling 5-incident roadmap...");
      const caseRes = await fetch("/api/casefile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: targetGoal }),
      });
      const caseFile: CaseFile = await caseRes.json();

      // 2. Calibrate and fetch Incident 1
      setLoadingStep("Calibrating emergency incident 1...");
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

      // 3. Initialize store & redirect to /case
      initCaseState(caseFile, firstIncident);
      router.push("/case");
    } catch (err) {
      console.error("Failed to start case:", err);
      // Fallback redirect to case screen if needed
      router.push("/case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chalk text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-[760px] flex flex-col items-center text-center">
          {/* Header with behind-the-heading tilted sticker shapes */}
          <div className="relative mb-8 w-full flex justify-center">
            {/* Tilted Sticker 1: Clock in Frost */}
            <div
              className="absolute -top-6 left-2 sm:left-8 w-13 h-13 sm:w-14 sm:h-14 rounded-[14px] bg-frost border-[2.5px] border-ink shadow-btn -rotate-12 flex items-center justify-center text-ink select-none pointer-events-none"
              aria-hidden="true"
            >
              <Clock className="w-7 h-7 text-ink" strokeWidth={2.5} />
            </div>

            {/* Tilted Sticker 2: Rewind Arrow in Flamingo */}
            <div
              className="absolute -top-5 right-2 sm:right-8 w-13 h-13 sm:w-14 sm:h-14 rounded-[14px] bg-flamingo border-[2.5px] border-ink shadow-btn rotate-12 flex items-center justify-center text-ink select-none pointer-events-none"
              aria-hidden="true"
            >
              <Rewind className="w-7 h-7 fill-ink text-ink" strokeWidth={2.5} />
            </div>

            {/* H1 Heading (2 lines, Bricolage Grotesque 800) */}
            <h1 className="font-display font-extrabold text-[36px] sm:text-[48px] leading-[42px] sm:leading-[52px] tracking-[-0.01em] text-ink relative z-10">
              Fix the worst day.
              <br />
              <span className="text-ink">Learn the skill.</span>
            </h1>
          </div>

          <p className="text-mute font-sans font-medium text-[18px] sm:text-[20px] max-w-[560px] mb-8 leading-[28px]">
            Don&apos;t read about disasters. Step into the on-call shoes, make the critical call under pressure, and rewind time when it goes wrong.
          </p>

          {/* Core Interactive Card */}
          <div className="w-full bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 flex flex-col gap-6 text-left">
            {/* Compact Resume Card */}
            {resumableCase && (
              <div className="w-full bg-butter border-[2.5px] border-ink rounded-[16px] shadow-[3px_3px_0_#17171C] p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-paper border-[2px] border-ink flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 fill-ink text-ink ml-0.5" strokeWidth={2.5} />
                  </span>
                  <div className="truncate">
                    <span className="font-sans font-bold text-[16px] sm:text-[17px] text-ink block truncate">
                      Resume {resumableCase.goal}
                    </span>
                    <span className="font-mono text-[12px] sm:text-[13px] font-semibold text-ink/80 block">
                      {resumableCase.results.length}/5 incidents done
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resumeCase(resumableCase.id);
                    router.push("/case");
                  }}
                  className="px-4 py-1.5 bg-paper hover:bg-chalk border-[2px] border-ink rounded-full font-sans font-bold text-[14px] text-ink shadow-[2px_2px_0_#17171C] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex-shrink-0"
                >
                  Resume
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="goal-input"
                className="block font-display font-bold text-[18px] sm:text-[20px] text-ink mb-2"
              >
                What do you want to learn?
              </label>

              {/* Big Text Input */}
              <input
                id="goal-input"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value.slice(0, 80))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleStartCase();
                  }
                }}
                disabled={loading}
                maxLength={80}
                placeholder="e.g. Cybersecurity, UI/UX, SQL, DevOps..."
                className="w-full h-[58px] px-4 text-ink font-sans text-[18px] sm:text-[20px] bg-paper border-[2.5px] border-ink rounded-[14px] focus:outline-none focus:ring-2 focus:ring-butter transition-all shadow-[2px_2px_0_#17171C] disabled:bg-stone/30"
              />
            </div>

            {/* Example Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[14px] font-semibold text-mute mr-1">Examples:</span>
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setGoal(chip);
                    if (!loading) handleStartCase(chip);
                  }}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-paper hover:bg-butter border-[2px] border-ink rounded-full text-[15px] font-sans font-semibold text-ink shadow-[2px_2px_0_#17171C] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Primary Action Button */}
            <PrimaryButton
              fullWidth
              disabled={loading}
              onClick={() => handleStartCase()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-ink border-t-transparent rounded-full" />
                  {loadingStep}
                </span>
              ) : (
                "Start the case"
              )}
            </PrimaryButton>
          </div>

          {/* Reassurance text */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-mute text-[14px] sm:text-[15px] font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-ink inline" strokeWidth={2.5} /> 5 escalating emergencies
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-ink inline" strokeWidth={2.5} /> 3 rewind tokens
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-ink inline" strokeWidth={2.5} /> 1 decision at a time
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
