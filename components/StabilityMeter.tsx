"use client";

import React from "react";

export interface StabilityMeterProps {
  value: number; // 0 to 100
  delta?: number;
  className?: string;
}

export function StabilityMeter({ value, delta, className = "" }: StabilityMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  // Color by value threshold (design.md section 6)
  let fillColor = "bg-butter";
  if (clamped <= 30) {
    fillColor = "bg-flamingo";
  } else if (clamped >= 70) {
    fillColor = "bg-seafoam";
  }

  return (
    <div className={`w-full flex items-center gap-3 sm:gap-4 select-none ${className}`}>
      {/* Label on left */}
      <span className="font-sans font-bold text-[15px] sm:text-[16px] text-ink">
        Stability
      </span>

      {/* Pill Track */}
      <div className="relative flex-1 h-[26px] sm:h-[28px] bg-stone/40 border-[2.5px] border-ink rounded-full overflow-hidden p-[2px] shadow-[2px_2px_0_#17171C]">
        {/* Tick marks at 25%, 50%, 75% */}
        <div className="absolute inset-0 pointer-events-none flex justify-between px-[25%] opacity-30 z-10">
          <div className="w-[1.5px] h-full bg-ink" />
          <div className="w-[1.5px] h-full bg-ink" />
        </div>

        {/* Animated Fill Bar */}
        <div
          className={`h-full rounded-full border-r-[2px] border-ink transition-all duration-700 ease-out ${fillColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {/* Numerical value on right in DM Mono */}
      <div className="min-w-[36px] text-right font-mono font-bold text-[18px] sm:text-[20px] text-ink flex items-center justify-end gap-1">
        <span>{clamped}</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={`text-[13px] font-mono font-bold ${
              delta > 0 ? "text-seafoam" : "text-flamingo"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
}
