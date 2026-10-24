"use client";

import React from "react";
import { Option } from "@/lib/schema";
import { PrimaryButton } from "./PrimaryButton";
import { AlertTriangle, Check, Rewind } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export interface RevealPanelProps {
  chosenOption: Option;
  chosenLetter: string;
  tokens: number;
  onRewind: () => void;
  onContinue: () => void;
}

export function RevealPanel({
  chosenOption,
  chosenLetter,
  tokens,
  onRewind,
  onContinue,
}: RevealPanelProps) {
  const isBest = chosenOption.is_best;
  const delta = chosenOption.stability_delta;
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[760px] mx-auto select-none my-2">
      {/* Glitch Ghost Background Cards for wrong answer (design.md & Figma screenshot 2) */}
      {!isBest && (
        <>
          <motion.div
            className="absolute inset-0 bg-flamingo border-[2.5px] border-ink rounded-[20px] pointer-events-none"
            initial={shouldReduceMotion ? { x: 8, y: -8 } : { x: 0, y: 0 }}
            animate={
              shouldReduceMotion
                ? { x: 8, y: -8 }
                : {
                    x: [0, 10, -6, 9, -4, 8],
                    y: [0, -5, -7, -9, -8, -8],
                  }
            }
            transition={{ duration: 0.68, ease: "easeOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-0 bg-frost border-[2.5px] border-ink rounded-[20px] pointer-events-none"
            initial={shouldReduceMotion ? { x: -8, y: -8 } : { x: 0, y: 0 }}
            animate={
              shouldReduceMotion
                ? { x: -8, y: -8 }
                : {
                    x: [0, -10, 6, -9, 4, -8],
                    y: [0, -5, -7, -9, -8, -8],
                  }
            }
            transition={{ duration: 0.68, ease: "easeOut" }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Main Front Card */}
      <motion.div
        className="relative z-10 bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 flex flex-col gap-6 text-left"
        initial={shouldReduceMotion ? false : { x: 0 }}
        animate={
          !isBest && !shouldReduceMotion
            ? { x: [0, -4, 4, -3, 3, -1, 1, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Badge */}
          {isBest ? (
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 1.4, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22, duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-seafoam border-[2px] border-ink font-mono font-bold text-[12px] sm:text-[13px] tracking-wider uppercase text-ink"
            >
              <Check className="w-4 h-4 text-ink" strokeWidth={2.5} />
              Timeline Stabilized
            </motion.div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-flamingo border-[2px] border-ink font-mono font-bold text-[12px] sm:text-[13px] tracking-wider uppercase text-ink animate-pulse">
              <AlertTriangle className="w-4 h-4 text-ink" strokeWidth={2.5} />
              Timeline Collapsing
            </div>
          )}

          {/* Delta Indicator in DM Mono */}
          <div className="font-mono font-bold text-[16px] sm:text-[18px] text-ink">
            Stability {delta > 0 ? `+${delta}` : delta}
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-tight text-ink">
          {isBest ? "That saved the timeline." : "That made it worse."}
        </h2>

        {/* Chosen Option Banner */}
        <div
          className={`p-4 border-[2.5px] border-ink rounded-[14px] flex items-center gap-3.5 ${
            isBest ? "bg-seafoam" : "bg-flamingo"
          }`}
        >
          <span className="flex-shrink-0 w-8 h-8 rounded-full border-[2px] border-ink font-display font-bold text-[15px] flex items-center justify-center bg-chalk text-ink">
            {chosenLetter}
          </span>
          <span className="font-sans font-medium text-[16px] sm:text-[18px] text-ink leading-snug">
            {chosenOption.text}
          </span>
        </div>

        {/* Outcome Description */}
        <div className="font-sans font-medium text-[17px] sm:text-[19px] leading-[28px] text-ink">
          {chosenOption.outcome}
        </div>

        {/* Why it worked / failed in DM Mono */}
        <div className="font-mono text-[14px] sm:text-[15px] leading-[22px]">
          <span className="text-mute mr-2">
            {isBest ? "Why it worked:" : "Why it failed:"}
          </span>
          <span className="text-ink font-medium">{chosenOption.why}</span>
        </div>

        {/* Primary Action Button (Exactly ONE primary button per screen) */}
        <div className="pt-2">
          {!isBest && tokens > 0 ? (
            <button
              type="button"
              onClick={onRewind}
              className="w-full sm:w-auto h-[56px] px-8 bg-frost border-[2.5px] border-ink rounded-[14px] shadow-btn hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#17171C] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer select-none"
            >
              <Rewind className="w-5 h-5 fill-ink text-ink" strokeWidth={2.5} />
              <span className="font-sans font-bold text-[18px] text-ink">Rewind</span>
              <span className="font-mono text-[14px] text-mute font-medium">
                costs 1 token
              </span>
            </button>
          ) : (
            <PrimaryButton onClick={onContinue}>
              Continue
            </PrimaryButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
