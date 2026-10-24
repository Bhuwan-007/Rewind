"use client";

import React from "react";
import { EvidenceItem } from "@/lib/schema";

export interface EvidenceCardProps {
  item: EvidenceItem;
}

export function EvidenceCard({ item }: EvidenceCardProps) {
  const { kind, label, content } = item;

  // Extract big number for metric kind if present (e.g. "47% of billing servers encrypted" -> "47%" and rest)
  const isMetric = kind === "metric";
  let metricNumber = "";
  let metricLabel = content;

  if (isMetric) {
    const match = content.match(/^([0-9]+%|\$[0-9,.]+|[0-9]+x|[0-9,.]+)\s*(.*)/i);
    if (match) {
      metricNumber = match[1];
      metricLabel = match[2] || label;
    } else {
      metricNumber = label;
      metricLabel = content;
    }
  }

  return (
    <div className={`flex-1 min-w-[200px] border-[2.5px] border-ink rounded-[20px] shadow-card overflow-hidden flex flex-col text-left ${
      isMetric ? "bg-butter" : "bg-paper"
    }`}>
      {/* Header Strip with Kind Label in DM Mono */}
      <div className="bg-stone/50 border-b-[2.5px] border-ink px-4 py-1.5 flex items-center justify-between">
        <span className="font-mono font-bold text-[12px] sm:text-[13px] tracking-wider text-ink uppercase">
          {kind}
        </span>
      </div>

      {/* Card Body based on kind */}
      <div className={`flex-1 flex flex-col justify-center ${isMetric ? "p-5" : "p-4"}`}>
        {kind === "log" && (
          <div className="font-mono text-[13px] sm:text-[14px] leading-[22px] text-ink whitespace-pre-wrap select-text">
            {content}
          </div>
        )}

        {kind === "metric" && (
          <div className="flex flex-col justify-center">
            <div className="font-display font-extrabold text-[44px] sm:text-[50px] text-ink leading-none tracking-tight">
              {metricNumber}
            </div>
            {metricLabel && (
              <div className="font-sans font-bold text-[15px] sm:text-[16px] text-ink mt-2 leading-[20px]">
                {metricLabel}
              </div>
            )}
          </div>
        )}

        {kind === "message" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-sans font-semibold text-mute">
              {label || "Ops lead"}
            </span>
            <div className="bg-frost border-[2.5px] border-ink rounded-[14px] p-3.5 font-sans text-[14px] sm:text-[15px] text-ink font-medium leading-[20px]">
              {content}
            </div>
          </div>
        )}

        {kind === "screen" && (
          <div className="border-[2px] border-dashed border-ink rounded-[12px] p-3 font-mono text-[13px] sm:text-[14px] leading-[20px] text-ink bg-chalk/30">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
