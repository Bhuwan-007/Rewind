"use client";

import React from "react";
import { Debrief } from "@/lib/schema";
import { PrimaryButton } from "./PrimaryButton";
import { Lightbulb, Globe, ArrowRight } from "lucide-react";

export interface DebriefCardProps {
  debrief: Debrief;
  pointsEarned: number;
  isLastIncident: boolean;
  onNext: () => void;
}

export function DebriefCard({
  debrief,
  pointsEarned,
  isLastIncident,
  onNext,
}: DebriefCardProps) {
  return (
    <div className="w-full max-w-[760px] mx-auto select-none my-2 flex flex-col gap-6 text-left">
      {/* Big Paper Card with Outline & Shadow */}
      <div className="relative bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 flex flex-col gap-6">
        {/* Top Header Row with Butter ribbon label + Points sticker */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Butter Ribbon Label */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-butter border-[2px] border-ink font-mono font-bold text-[12px] sm:text-[13px] uppercase tracking-wider text-ink shadow-[2px_2px_0_#17171C]">
            Rule of thumb
          </div>

          {/* Points earned badge */}
          <div className="inline-flex items-center gap-1 font-mono font-extrabold text-[15px] sm:text-[16px] text-ink bg-seafoam border-[2px] border-ink px-3 py-0.5 rounded-full shadow-[2px_2px_0_#17171C]">
            +{pointsEarned} pts
          </div>
        </div>

        {/* Rule of Thumb Main Headline */}
        <h2 className="font-display font-extrabold text-[24px] sm:text-[30px] leading-tight text-ink">
          &ldquo;{debrief.rule_of_thumb}&rdquo;
        </h2>

        {/* Concept subtitle */}
        <div className="font-mono text-[14px] sm:text-[15px] text-mute font-semibold">
          Concept: {debrief.concept}
        </div>

        <div className="w-full border-t-[2px] border-ink/15 my-1" />

        {/* 3 Detail Rows with Frost, Butter, Chalk Chips */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Why it works (Frost chip) */}
          <div className="flex items-start gap-3.5">
            <span className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-frost border-[2px] border-ink flex items-center justify-center text-ink shadow-[1px_1px_0_#17171C]">
              <Lightbulb className="w-4 h-4 text-ink" strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <span className="font-mono font-bold text-[13px] uppercase tracking-wider text-mute block mb-0.5">
                Why it works
              </span>
              <p className="font-sans font-medium text-[16px] sm:text-[17px] leading-[24px] text-ink">
                {debrief.why_best_works}
              </p>
            </div>
          </div>

          {/* Row 2: In real life (Butter chip) */}
          <div className="flex items-start gap-3.5">
            <span className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-butter border-[2px] border-ink flex items-center justify-center text-ink shadow-[1px_1px_0_#17171C]">
              <Globe className="w-4 h-4 text-ink" strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <span className="font-mono font-bold text-[13px] uppercase tracking-wider text-mute block mb-0.5">
                In real life
              </span>
              <p className="font-sans font-medium text-[16px] sm:text-[17px] leading-[24px] text-ink">
                {debrief.real_world_note}
              </p>
            </div>
          </div>

          {/* Row 3: Up next (Chalk chip) */}
          <div className="flex items-start gap-3.5">
            <span className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-chalk border-[2px] border-ink flex items-center justify-center text-ink shadow-[1px_1px_0_#17171C]">
              <ArrowRight className="w-4 h-4 text-ink" strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <span className="font-mono font-bold text-[13px] uppercase tracking-wider text-mute block mb-0.5">
                Up next
              </span>
              <p className="font-sans font-medium text-[16px] sm:text-[17px] leading-[24px] text-ink">
                {debrief.next_teaser}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <PrimaryButton fullWidth onClick={onNext}>
            {isLastIncident ? "Complete case & view results" : "Next incident"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
