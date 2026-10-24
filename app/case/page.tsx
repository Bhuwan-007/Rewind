"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { Navbar } from "@/components/Navbar";
import { TimelineStrip } from "@/components/TimelineStrip";
import { StabilityMeter } from "@/components/StabilityMeter";
import { EvidenceCard } from "@/components/EvidenceCard";
import { OptionButton } from "@/components/OptionButton";
import { RevealPanel } from "@/components/RevealPanel";
import { DebriefCard } from "@/components/DebriefCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ShareCard } from "@/components/ShareCard";
import {
  getGameStateSnapshot,
  getServerSnapshot,
  subscribeToStore,
  saveGameState,
  initCaseState,
  consumeRewindToken,
  recordIncidentCompletion,
  advanceIncident,
  clearGameState,
} from "@/lib/store";
import { CaseFile, Incident, Option, FullCaseFileSchema } from "@/lib/schema";
import { scoreForRewinds, rankForScore, nextDifficulty } from "@/lib/game";
import cybersecuritySeed from "@/lib/seed/cybersecurity.json";
import { AlertTriangle, Trophy, Sparkles, Download, ArrowLeft } from "lucide-react";

type FlowStep = "incident" | "reveal" | "debrief" | "closed";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function CasePage() {
  const router = useRouter();

  // Reactive store subscription
  const gameState = useSyncExternalStore(
    subscribeToStore,
    getGameStateSnapshot,
    getServerSnapshot
  );

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<FlowStep>("incident");
  const [chosenOption, setChosenOption] = useState<Option | null>(null);
  const [chosenLetter, setChosenLetter] = useState<string>("A");
  const [disabledOptionIds, setDisabledOptionIds] = useState<string[]>([]);
  const [currentRewindsUsed, setCurrentRewindsUsed] = useState(0);
  const [prefetchedIncident, setPrefetchedIncident] = useState<Incident | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [reportVerdict, setReportVerdict] = useState<string>(
    "Successfully contained the incident and restored operational integrity under pressure."
  );

  // Full seed cases as instant fallback for testing
  const parsedSeed = FullCaseFileSchema.parse(cybersecuritySeed);

  // Ensure case data exists on mount; if empty, initialize with seed case
  useEffect(() => {
    setMounted(true);
    const current = getGameStateSnapshot();
    if (!current.caseFile || !current.currentIncident) {
      const fallbackCase: CaseFile = {
        goal: parsedSeed.goal,
        reframed_goal: parsedSeed.reframed_goal,
        role: parsedSeed.role,
        tagline: parsedSeed.tagline,
        incidents: parsedSeed.incidents.map((inc) => ({
          id: inc.id,
          order: inc.order,
          title: inc.title,
          setting: inc.setting,
          concept: inc.concept,
          difficulty: inc.difficulty,
          hook: inc.hook,
        })),
      };
      initCaseState(fallbackCase, parsedSeed.incidents[0]);
    } else {
      // Resume step and disabled options from localStorage if available
      // Note: If stored step is 'reveal' without an in-memory chosenOption, safely resume at 'incident'
      if (current.currentStep && current.currentStep !== "reveal") {
        setStep(current.currentStep as FlowStep);
      } else {
        setStep("incident");
      }
      if (current.disabledOptionIds) {
        setDisabledOptionIds(current.disabledOptionIds);
      }
      if (current.prefetchedIncident) {
        setPrefetchedIncident(current.prefetchedIncident as Incident);
      }
    }
  }, []);

  const caseFile = gameState.caseFile || {
    goal: parsedSeed.goal,
    reframed_goal: parsedSeed.reframed_goal ?? null,
    role: parsedSeed.role,
    tagline: parsedSeed.tagline,
    incidents: parsedSeed.incidents,
  };

  const seedFallback =
    (parsedSeed.incidents[gameState.currentIndex] as Incident) ||
    (parsedSeed.incidents[0] as Incident);

  const rawIncident = gameState.currentIncident as Incident | null;
  const currentIncident: Incident =
    rawIncident &&
    Array.isArray(rawIncident.options) &&
    rawIncident.options.length > 0 &&
    Array.isArray(rawIncident.evidence) &&
    rawIncident.evidence.length > 0
      ? rawIncident
      : seedFallback;

  // If component reloaded on reveal step without chosenOption in state, treat as incident
  const activeStep: FlowStep = step === "reveal" && !chosenOption ? "incident" : step;

  const currentIndex = gameState.currentIndex || 0;
  const stability = gameState.stability ?? 50;
  const tokens = gameState.tokens ?? 3;
  const results = gameState.results || [];
  const score = gameState.score || 0;
  const finalRank = rankForScore(score);

  // Fetch report verdict on Case Closed
  useEffect(() => {
    if (step === "closed" && caseFile) {
      fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: caseFile.goal,
          role: caseFile.role,
          rank: finalRank,
          score,
          results,
          concepts: caseFile.incidents.map((inc) => inc.concept),
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.verdict) {
            setReportVerdict(data.verdict);
          }
        })
        .catch((err) => {
          console.warn("Using fallback verdict sentence:", err);
        });
    }
  }, [step, caseFile, finalRank, score, results]);

  // Prefetch the next incident in background while debrief is shown with adaptive difficulty
  useEffect(() => {
    if (step === "debrief" && currentIndex < 4 && caseFile) {
      const nextIdx = currentIndex + 1;
      const nextMeta = caseFile.incidents[nextIdx];
      if (nextMeta && (!prefetchedIncident || prefetchedIncident.id !== nextMeta.id)) {
        const adaptedDiff = nextDifficulty(currentIncident.difficulty, currentRewindsUsed);
        const supportLevel = currentRewindsUsed >= 2 ? "high" : "normal";

        fetch("/api/incident", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: caseFile.goal,
            role: caseFile.role,
            incident: nextMeta,
            difficulty: adaptedDiff,
            support_level: supportLevel,
            previous_concepts: results
              .map((r, i) => caseFile.incidents[i]?.concept)
              .filter(Boolean)
              .join(", "),
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setPrefetchedIncident(data);
              saveGameState({
                ...getGameStateSnapshot(),
                prefetchedIncident: data,
              });
            }
          })
          .catch((err) => console.warn("Background prefetch failed:", err));
      }
    }
  }, [step, currentIndex, caseFile, currentIncident.difficulty, currentRewindsUsed, results, prefetchedIncident]);

  // Update step and save to localStorage
  const transitionToStep = (nextStep: FlowStep, updatedDisabledIds?: string[]) => {
    setStep(nextStep);
    const latestState = getGameStateSnapshot();
    saveGameState({
      ...latestState,
      currentStep: nextStep,
      disabledOptionIds: updatedDisabledIds ?? latestState.disabledOptionIds ?? disabledOptionIds,
    });
  };

  // Handle committing an option choice
  const handleSelectOption = (option: Option, letter: string) => {
    if (disabledOptionIds.includes(option.id)) return;

    setChosenOption(option);
    setChosenLetter(letter);

    // Apply stability delta and update store
    const nextStability = Math.max(0, Math.min(100, stability + option.stability_delta));
    saveGameState({
      ...gameState,
      stability: nextStability,
      currentStep: "reveal",
    });

    setStep("reveal");
  };

  // Handle Rewind button press
  const handleRewind = () => {
    if (tokens <= 0 || !chosenOption) return;

    // 1. Consume 1 token in store & reset stability to 50
    consumeRewindToken(gameState);

    // 2. Disable chosen option for this incident
    const nextDisabled = [...disabledOptionIds, chosenOption.id];
    setDisabledOptionIds(nextDisabled);
    setCurrentRewindsUsed((prev) => prev + 1);

    // 3. Return to incident screen
    setChosenOption(null);
    transitionToStep("incident", nextDisabled);
  };

  // Handle Continue button press after reveal
  const handleContinueAfterReveal = () => {
    transitionToStep("debrief");
  };

  // Handle Next Incident button press
  const handleNextIncident = async () => {
    const pointsEarned = scoreForRewinds(currentRewindsUsed);
    const incidentResult = {
      incidentId: currentIncident.id,
      difficulty: currentIncident.difficulty,
      rewindsUsed: currentRewindsUsed,
      points: pointsEarned,
      solvedFirstTry: currentRewindsUsed === 0,
    };

    // 1. Record completed result in store
    const updatedState = recordIncidentCompletion(gameState, incidentResult);

    // 2. Check if this was the last incident
    if (currentIndex >= 4) {
      transitionToStep("closed");
      return;
    }

    // 3. Load next incident: use prefetched if ready, else fetch or use seed
    const nextIdx = currentIndex + 1;
    let nextIncident: Incident = prefetchedIncident || (parsedSeed.incidents[nextIdx] as Incident);

    if (!prefetchedIncident) {
      try {
        const nextMeta = caseFile.incidents[nextIdx];
        const adaptedDiff = nextDifficulty(currentIncident.difficulty, currentRewindsUsed);
        const supportLevel = currentRewindsUsed >= 2 ? "high" : "normal";

        const res = await fetch("/api/incident", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: caseFile.goal,
            role: caseFile.role,
            incident: nextMeta,
            difficulty: adaptedDiff,
            support_level: supportLevel,
          }),
        });
        if (res.ok) {
          nextIncident = await res.json();
        }
      } catch (err) {
        console.warn("Using fallback seed for next incident:", err);
      }
    }

    // 4. Advance store to next incident
    advanceIncident(updatedState, nextIncident);

    // 5. Reset local incident state for next round
    setDisabledOptionIds([]);
    setCurrentRewindsUsed(0);
    setChosenOption(null);
    setPrefetchedIncident(null);
    setStep("incident");
  };

  // Download Share Card as PNG
  const handleDownloadCard = async () => {
    if (!shareCardRef.current || downloading) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `rewind-${caseFile.goal.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export share card:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Restart case
  const handleRestart = () => {
    clearGameState();
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  const isLastIncident = currentIndex >= 4;
  const currentPoints = scoreForRewinds(currentRewindsUsed);
  const perfectCount = results.filter((r) => r.rewindsUsed === 0).length;

  return (
    <div className="min-h-screen bg-chalk text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 pt-20 pb-20">
        <div className="w-full max-w-[760px] flex flex-col items-center">
          {/* Timeline Strip (roadmap persistent on screens) */}
          {activeStep !== "closed" && (
            <TimelineStrip
              incidents={caseFile.incidents}
              currentIndex={currentIndex}
              results={results}
            />
          )}

          {/* Stability Meter (visible on incident & reveal) */}
          {(activeStep === "incident" || activeStep === "reveal") && (
            <StabilityMeter
              value={stability}
              delta={activeStep === "reveal" && chosenOption ? chosenOption.stability_delta : undefined}
              className="my-3"
            />
          )}

          {/* STEP 1: INCIDENT SCREEN */}
          {activeStep === "incident" && (
            <div className="w-full flex flex-col gap-5 my-2">
              {/* Alert Banner (Flamingo fill, 2.5px outline, hard shadow) */}
              <div className="w-full bg-flamingo border-[2.5px] border-ink rounded-[20px] shadow-card p-5 sm:p-6 text-left">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-6 h-6 text-ink" strokeWidth={2.5} />
                  </span>
                  <div className="flex-1">
                    <h1 className="font-display font-extrabold text-[20px] sm:text-[24px] leading-tight text-ink mb-1.5">
                      {currentIncident.alert}
                    </h1>
                    <div className="font-mono text-[13px] sm:text-[14px] text-ink font-semibold opacity-90">
                      {currentIncident.clock}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Evidence Cards (Grid or row) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-1">
                {currentIncident.evidence.map((item, idx) => (
                  <EvidenceCard key={idx} item={item} />
                ))}
              </div>

              {/* Question Heading */}
              <div className="text-left mt-2">
                <h2 className="font-display font-extrabold text-[24px] sm:text-[28px] text-ink">
                  {currentIncident.question || "What do you do first?"}
                </h2>
              </div>

              {/* 4 Option Buttons (2x2 on desktop, stacked on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentIncident.options.map((option, idx) => {
                  const letter = OPTION_LETTERS[idx] || String(idx + 1);
                  const isDisabled = disabledOptionIds.includes(option.id);
                  return (
                    <OptionButton
                      key={option.id}
                      letter={letter}
                      text={option.text}
                      disabled={isDisabled}
                      state={isDisabled ? "faded" : "default"}
                      onClick={() => handleSelectOption(option, letter)}
                    />
                  );
                })}
              </div>

              {/* Bottom Mute Note */}
              <div className="text-center font-mono text-[13px] text-mute font-medium mt-1">
                One decision. Choose carefully, or rewind.
              </div>
            </div>
          )}

          {/* STEP 2: REVEAL SCREEN */}
          {activeStep === "reveal" && chosenOption && (
            <RevealPanel
              chosenOption={chosenOption}
              chosenLetter={chosenLetter}
              tokens={tokens}
              onRewind={handleRewind}
              onContinue={handleContinueAfterReveal}
            />
          )}

          {/* STEP 3: DEBRIEF SCREEN */}
          {activeStep === "debrief" && (
            <DebriefCard
              debrief={currentIncident.debrief}
              pointsEarned={currentPoints}
              isLastIncident={isLastIncident}
              onNext={handleNextIncident}
            />
          )}

          {/* STEP 4: CASE CLOSED SCREEN */}
          {activeStep === "closed" && (
            <div className="w-full bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-10 flex flex-col items-center text-center my-6 gap-6">
              {/* Rank Sticker (rotated -3deg in Butter) */}
              <div className="bg-butter border-[2.5px] border-ink rounded-[14px] shadow-btn px-6 py-2 rotate-[-3deg] inline-flex items-center gap-2">
                <Trophy className="w-6 h-6 text-ink" strokeWidth={2.5} />
                <span className="font-display font-extrabold text-[24px] sm:text-[28px] text-ink uppercase tracking-wide">
                  Rank: {finalRank}
                </span>
              </div>

              {/* Big Score in Bricolage 800 (56px) */}
              <div>
                <div className="font-display font-extrabold text-[52px] sm:text-[64px] text-ink leading-none">
                  {score}
                  <span className="text-[24px] sm:text-[28px] text-mute font-bold"> / 500</span>
                </div>
                <div className="font-mono text-[14px] sm:text-[15px] font-semibold text-mute mt-1">
                  Total Case Score
                </div>
              </div>

              {/* Key Badges & Achievements */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="bg-seafoam border-[2px] border-ink rounded-full px-4 py-1.5 font-mono text-[14px] font-bold text-ink flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#17171C]">
                  <Sparkles className="w-4 h-4 text-ink" strokeWidth={2.5} />
                  {perfectCount} Perfect {perfectCount === 1 ? "Timeline" : "Timelines"}
                </div>
                <div className="bg-frost border-[2px] border-ink rounded-full px-4 py-1.5 font-mono text-[14px] font-bold text-ink shadow-[1.5px_1.5px_0_#17171C]">
                  {tokens} Rewind {tokens === 1 ? "Token" : "Tokens"} Preserved
                </div>
              </div>

              {/* Concepts Unlocked List */}
              <div className="w-full text-left bg-chalk/60 border-[2px] border-ink rounded-[14px] p-4 sm:p-5">
                <h3 className="font-display font-bold text-[16px] sm:text-[18px] text-ink mb-3">
                  Concepts Mastered Under Fire:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseFile.incidents.map((inc, i) => (
                    <span
                      key={i}
                      className="bg-paper border-[1.5px] border-ink rounded-full px-3 py-1 font-mono text-[13px] font-semibold text-ink shadow-[1px_1px_0_#17171C]"
                    >
                      ✓ {inc.concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share Card Component */}
              <div className="w-full flex justify-center my-2">
                <ShareCard
                  ref={shareCardRef}
                  goal={caseFile.goal}
                  role={caseFile.role}
                  score={score}
                  rank={finalRank}
                  perfectCount={perfectCount}
                  tokensPreserved={tokens}
                  concepts={caseFile.incidents.map((inc) => inc.concept)}
                  verdict={reportVerdict}
                />
              </div>

              {/* Actions: Exactly ONE primary button ("Download card"), plus secondary text link */}
              <div className="w-full flex flex-col items-center gap-3 pt-2">
                <PrimaryButton fullWidth onClick={handleDownloadCard} disabled={downloading}>
                  <Download className="w-5 h-5 text-ink inline mr-2" strokeWidth={2.5} />
                  {downloading ? "Exporting card..." : "Download card"}
                </PrimaryButton>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="font-sans font-semibold text-[15px] text-mute hover:text-ink underline transition-colors cursor-pointer py-1"
                >
                  Start another skill
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
