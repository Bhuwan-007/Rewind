"use client";

import React, { forwardRef } from "react";
import { ReportRank } from "@/lib/schema";
import { Trophy, Sparkles, Rewind } from "lucide-react";

export interface ShareCardProps {
  goal: string;
  role: string;
  score: number;
  rank: ReportRank;
  perfectCount: number;
  tokensPreserved: number;
  concepts: string[];
  verdict: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  {
    goal,
    role,
    score,
    rank,
    perfectCount,
    tokensPreserved,
    concepts,
    verdict,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className="w-full max-w-[520px] bg-chalk border-[3px] border-ink rounded-[24px] shadow-[6px_6px_0_#17171C] p-6 sm:p-8 flex flex-col gap-5 text-left select-none relative overflow-hidden"
      style={{ backgroundColor: "#F2F2EE", borderColor: "#17171C" }}
    >
      {/* Top Header with Brand */}
      <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-[9px] bg-butter border-[2px] border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_#17171C]">
            <Rewind className="w-4 h-4 fill-ink" strokeWidth={2.5} />
          </span>
          <span className="font-display font-extrabold text-[20px] tracking-tight text-ink">
            Rewind
          </span>
        </div>
        <span className="font-mono text-[12px] font-bold text-mute uppercase tracking-wider">
          Incident Response File
        </span>
      </div>

      {/* Goal & Role */}
      <div>
        <div className="font-mono text-[13px] font-semibold text-mute uppercase tracking-wider">
          Skill Tested
        </div>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[30px] leading-tight text-ink">
          {goal}
        </h2>
        <div className="font-sans text-[14px] font-medium text-mute mt-0.5">
          Role: {role}
        </div>
      </div>

      {/* Main Stats Cluster */}
      <div className="flex items-center justify-between gap-4 bg-paper border-[2.5px] border-ink rounded-[16px] p-4 shadow-[3px_3px_0_#17171C]">
        {/* Score in 56px Bricolage Grotesque */}
        <div>
          <div className="font-display font-extrabold text-[48px] sm:text-[56px] text-ink leading-none">
            {score}
            <span className="text-[20px] text-mute font-bold"> / 500</span>
          </div>
          <div className="font-mono text-[12px] font-bold text-mute uppercase mt-1">
            Total Score
          </div>
        </div>

        {/* Tilted Rank Sticker in Butter */}
        <div className="bg-butter border-[2.5px] border-ink rounded-[14px] shadow-btn px-4 py-2 rotate-[-4deg] flex items-center gap-1.5 self-center">
          <Trophy className="w-5 h-5 text-ink" strokeWidth={2.5} />
          <span className="font-display font-extrabold text-[20px] sm:text-[22px] text-ink uppercase tracking-wide">
            {rank}
          </span>
        </div>
      </div>

      {/* Performance Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-seafoam border-[2px] border-ink rounded-full px-3 py-1 font-mono text-[12px] sm:text-[13px] font-bold text-ink flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#17171C]">
          <Sparkles className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
          <span>{perfectCount} Perfect Timeline{perfectCount === 1 ? "" : "s"}</span>
        </div>
        <div className="bg-frost border-[2px] border-ink rounded-full px-3 py-1 font-mono text-[12px] sm:text-[13px] font-bold text-ink shadow-[1.5px_1.5px_0_#17171C]">
          <span>{tokensPreserved} Rewind Token{tokensPreserved === 1 ? "" : "s"} Saved</span>
        </div>
      </div>

      {/* Verdict Quote */}
      <div className="bg-paper border-[2px] border-ink rounded-[14px] p-4 font-sans font-medium text-[15px] sm:text-[16px] leading-[22px] text-ink shadow-[2px_2px_0_#17171C]">
        &ldquo;{verdict}&rdquo;
      </div>

      {/* Mastered Concepts */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[12px] font-bold text-mute uppercase tracking-wider">
          Concepts Mastered Under Fire
        </div>
        <div className="flex flex-wrap gap-1.5">
          {concepts.map((concept, i) => (
            <span
              key={i}
              className="bg-paper border-[1.5px] border-ink rounded-full px-2.5 py-0.5 font-mono text-[12px] font-semibold text-ink shadow-[1px_1px_0_#17171C]"
            >
              ✓ {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="pt-2 border-t-[2px] border-ink/15 flex items-center justify-between text-mute font-mono text-[11px] sm:text-[12px]">
        <span>Rewind · learn by fixing the worst day</span>
        <span>Verified crisis run</span>
      </div>
    </div>
  );
});
