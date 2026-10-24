"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Navbar } from "@/components/Navbar";
import {
  getGameStateSnapshot,
  getServerSnapshot,
  subscribeToStore,
} from "@/lib/store";
import { FullCaseFileSchema, CaseFile } from "@/lib/schema";
import { generateCurveNote } from "@/lib/game";
import cybersecuritySeed from "@/lib/seed/cybersecurity.json";
import { Check, Lock } from "lucide-react";

export default function CurvePage() {
  const gameState = useSyncExternalStore(
    subscribeToStore,
    getGameStateSnapshot,
    getServerSnapshot
  );

  const [mounted, setMounted] = useState(false);
  const [aiNote, setAiNote] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedSeed = FullCaseFileSchema.parse(cybersecuritySeed);
  const caseFile: CaseFile = gameState.caseFile || {
    goal: parsedSeed.goal,
    reframed_goal: parsedSeed.reframed_goal ?? null,
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

  const results = gameState.results || [];
  const completedCount = results.length;

  // Generate or fetch AI Curve Note
  useEffect(() => {
    if (gameState.curveNote) {
      setAiNote(gameState.curveNote);
      return;
    }

    // Default analytical note based on actual results
    const fallbackNote = generateCurveNote(results, caseFile.goal);
    setAiNote(fallbackNote);

    // If we have completed incidents, optionally query /api/report for live curve note
    if (results.length > 0) {
      fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: caseFile.goal,
          role: caseFile.role,
          score: gameState.score,
          results,
          concepts: caseFile.incidents.slice(0, completedCount).map((inc) => inc.concept),
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.curve_note) {
            setAiNote(data.curve_note);
          }
        })
        .catch(() => {
          // Keep fallbackNote
        });
    }
  }, [results, caseFile, gameState.curveNote, gameState.score, completedCount]);

  if (!mounted) {
    return null;
  }

  // 5 incident slots
  const totalIncidents = 5;
  const incidents = caseFile.incidents || [];

  // SVG Chart Geometry
  // ViewBox: 600 x 220
  // X positions: 50, 175, 300, 425, 550
  const xPositions = [50, 175, 300, 425, 550];

  // Y positions:
  // 100 pts -> Y = 40 (Top line)
  // 60 pts  -> Y = 110 (Mid line)
  // 30 pts  -> Y = 180 (Bottom line)
  const getYForPoints = (pts: number) => {
    if (pts >= 100) return 40;
    if (pts >= 60) return 110;
    return 180;
  };

  // Build points for completed incidents
  const completedPoints = results.slice(0, totalIncidents).map((res, idx) => ({
    x: xPositions[idx],
    y: getYForPoints(res.points),
    points: res.points,
    rewinds: res.rewindsUsed,
  }));

  // SVG polyline/path string for connected line
  const pathD = completedPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  return (
    <div className="min-h-screen bg-chalk text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 pt-24 pb-20">
        <div className="w-full max-w-[760px] flex flex-col gap-6 text-left">
          {/* Header */}
          <div>
            <h1 className="font-display font-extrabold text-[36px] sm:text-[44px] leading-tight text-ink">
              Your learning curve
            </h1>
            <div className="font-mono text-[14px] sm:text-[16px] text-mute font-medium mt-1">
              {caseFile.goal} · {completedCount} of {totalIncidents} incidents done
            </div>
          </div>

          {/* Main Chart Card */}
          <div className="w-full bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 flex flex-col gap-6 select-none">
            {/* Card Header & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display font-extrabold text-[20px] sm:text-[22px] text-ink">
                Points per incident
              </h2>

              {/* Legend (Seafoam = no rewinds, Butter = 1, Flamingo = 2+) */}
              <div className="flex items-center gap-3 sm:gap-4 font-mono text-[12px] sm:text-[13px] text-ink font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-seafoam border-[1.5px] border-ink inline-block" />
                  <span>no rewinds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-butter border-[1.5px] border-ink inline-block" />
                  <span>1 rewind</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-flamingo border-[1.5px] border-ink inline-block" />
                  <span>2+ rewinds</span>
                </div>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px] w-full">
                <svg
                  viewBox="0 0 600 220"
                  className="w-full h-[200px] sm:h-[230px] overflow-visible"
                >
                  {/* Grid Lines (Stone #D9D9D4) */}
                  <line
                    x1="40"
                    y1="40"
                    x2="560"
                    y2="40"
                    stroke="#D9D9D4"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="40"
                    y1="110"
                    x2="560"
                    y2="110"
                    stroke="#D9D9D4"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="40"
                    y1="180"
                    x2="560"
                    y2="180"
                    stroke="#D9D9D4"
                    strokeWidth="1.5"
                  />

                  {/* Connecting Line for completed incidents */}
                  {completedPoints.length > 1 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#17171C"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Plotted Dots for 5 incidents */}
                  {xPositions.map((x, idx) => {
                    const isDone = idx < completedCount;
                    const res = results[idx];

                    if (isDone && res) {
                      const y = getYForPoints(res.points);
                      let dotColor = "#8FE3CB"; // Seafoam (0 rewinds)
                      if (res.rewindsUsed === 1) {
                        dotColor = "#FFDC4A"; // Butter (1 rewind)
                      } else if (res.rewindsUsed >= 2) {
                        dotColor = "#FF86AD"; // Flamingo (2+ rewinds)
                      }

                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r="9"
                            fill={dotColor}
                            stroke="#17171C"
                            strokeWidth="2.5"
                          />
                        </g>
                      );
                    }

                    // Uncompleted incident: Dashed circle on baseline (Y = 180)
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy="180"
                        r="8"
                        fill="none"
                        stroke="#5B5B66"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    );
                  })}
                </svg>

                {/* X-axis labels below the chart */}
                <div className="w-full flex justify-between px-2 pt-2">
                  {incidents.slice(0, 5).map((inc, idx) => (
                    <div
                      key={idx}
                      className="w-[100px] text-center font-sans font-semibold text-[12px] sm:text-[13px] text-ink truncate"
                      title={`${idx + 1} ${inc.title}`}
                    >
                      {idx + 1} {inc.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Concepts Unlocked Section */}
          <div className="flex flex-col gap-3">
            <h2 className="font-display font-extrabold text-[20px] sm:text-[22px] text-ink">
              Concepts unlocked
            </h2>

            <div className="flex flex-wrap gap-2.5">
              {incidents.slice(0, 5).map((inc, idx) => {
                const isUnlocked = idx < completedCount;

                if (isUnlocked) {
                  return (
                    <div
                      key={idx}
                      className="bg-seafoam border-[2px] border-ink rounded-full px-4 py-2 font-mono text-[13px] sm:text-[14px] font-bold text-ink shadow-[2px_2px_0_#17171C] flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-ink" strokeWidth={2.5} />
                      <span>{inc.concept}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="bg-stone/40 border-[2px] border-ink/40 rounded-full px-4 py-2 font-mono text-[13px] sm:text-[14px] font-semibold text-mute flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-ink/60" strokeWidth={2.5} />
                    <span>???</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Note Card */}
          <div className="w-full bg-frost border-[2.5px] border-ink rounded-[20px] shadow-card p-6 flex flex-col gap-3">
            <div className="self-start">
              <span className="inline-block bg-butter border-[2px] border-ink rounded-full px-3 py-0.5 font-mono text-[12px] font-bold text-ink uppercase tracking-wider shadow-[1.5px_1.5px_0_#17171C]">
                AI NOTE
              </span>
            </div>

            <p className="font-sans font-medium text-[16px] sm:text-[18px] leading-[26px] text-ink">
              {aiNote || "Analyzing your learning trajectory across crisis scenarios..."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
