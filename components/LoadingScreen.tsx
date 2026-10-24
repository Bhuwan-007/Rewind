"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Rewind, Check, Sparkles } from "lucide-react";

export interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  goal?: string;
  step?: number; // 0, 1, 2
  fullscreen?: boolean;
}

const DEFAULT_STEPS = [
  "Rewinding clock to the worst day...",
  "Assembling 5-incident crisis roadmap...",
  "Calibrating emergency scenario...",
];

const TICKER_MESSAGES = [
  "Simulating critical system entropy",
  "Locating single point of failure",
  "Injecting production pressure",
  "Pre-caching incident telemetry logs",
];

export function LoadingScreen({
  title = "Rewinding the clock...",
  subtitle = "Preparing high-stakes crisis simulation",
  goal,
  step = 0,
  fullscreen = false,
}: LoadingScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const cardContent = (
    <div className="w-full max-w-[560px] bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card p-6 sm:p-8 text-center flex flex-col items-center gap-6">
      {/* Tilted Animated Rewind Sticker */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                rotate: [-4, 4, -4],
                scale: [1, 1.04, 1],
              }
        }
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut",
        }}
        className="bg-butter border-[2.5px] border-ink rounded-[16px] shadow-btn p-3.5 flex items-center justify-center -rotate-3"
      >
        <Rewind className="w-9 h-9 text-ink" strokeWidth={2.5} />
      </motion.div>

      {/* Title & Goal Badge */}
      <div className="flex flex-col items-center gap-2">
        {goal && (
          <div className="bg-frost border-[2px] border-ink rounded-full px-3.5 py-1 font-mono text-[13px] font-bold text-ink inline-flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#17171C]">
            <Sparkles className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
            <span>Target: {goal}</span>
          </div>
        )}
        <h2 className="font-display font-extrabold text-[26px] sm:text-[32px] text-ink leading-tight">
          {title}
        </h2>
        <p className="font-sans text-[16px] text-mute font-medium max-w-[420px]">
          {subtitle}
        </p>
      </div>

      {/* Progress Steps (Sticker Arcade style) */}
      <div className="w-full flex flex-col gap-2.5 text-left my-1">
        {DEFAULT_STEPS.map((stepText, idx) => {
          const isDone = idx < step;
          const isCurrent = idx === step;
          const isPending = idx > step;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-[12px] border-[2px] transition-all duration-300 ${
                isDone
                  ? "bg-seafoam/25 border-ink text-ink font-semibold"
                  : isCurrent
                  ? "bg-butter/30 border-ink text-ink font-bold shadow-[2px_2px_0_#17171C]"
                  : "bg-stone/20 border-stone text-mute opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center text-[12px] font-mono font-bold flex-shrink-0 ${
                  isDone
                    ? "bg-seafoam border-ink text-ink"
                    : isCurrent
                    ? "bg-butter border-ink text-ink animate-pulse"
                    : "bg-stone border-stone text-mute"
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-ink" strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </div>

              <span className="font-sans text-[15px] sm:text-[16px] flex-1">
                {stepText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stepped Progress Bar */}
      <div className="w-full bg-stone border-[2px] border-ink rounded-full h-3 overflow-hidden p-0.5">
        <motion.div
          className="bg-butter h-full rounded-full border-r-[1.5px] border-ink"
          initial={{ width: "20%" }}
          animate={{
            width: step === 0 ? "35%" : step === 1 ? "70%" : "95%",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Retro Status Ticker */}
      <div className="w-full bg-chalk border-[2px] border-ink rounded-[10px] py-2 px-3 font-mono text-[13px] text-ink font-semibold flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-flamingo animate-ping" />
        <span className="tracking-wide uppercase truncate">
          [SYS] {TICKER_MESSAGES[tickerIndex]}
        </span>
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-none flex items-center justify-center p-4">
        {cardContent}
      </div>
    );
  }

  return cardContent;
}
