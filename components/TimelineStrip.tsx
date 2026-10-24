"use client";

import React from "react";
import { Check, Lock, Star } from "lucide-react";
import { IncidentMeta, IncidentResult } from "@/lib/schema";
import { motion, useReducedMotion } from "framer-motion";

export interface TimelineStripProps {
  incidents: IncidentMeta[];
  currentIndex: number;
  results: IncidentResult[];
}

export function TimelineStrip({
  incidents,
  currentIndex,
  results,
}: TimelineStripProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="w-full flex flex-col items-center select-none py-2 mb-3">
      {/* Horizontal row of 5 nodes joined by line */}
      <div className="w-full max-w-[560px] flex items-center justify-between relative px-4">
        {incidents.map((inc, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLocked = idx > currentIndex;

          const result = results.find((r) => r.incidentId === inc.id) || results[idx];
          const isPerfect = isDone && result?.rewindsUsed === 0;

          // Connector line to the next node
          const showConnector = idx < incidents.length - 1;
          const nextIsLocked = idx >= currentIndex;

          return (
            <React.Fragment key={inc.id || idx}>
              {/* Node Item */}
              <div className="relative flex flex-col items-center z-10">
                {isDone ? (
                  isPerfect ? (
                    <motion.div
                      initial={shouldReduceMotion ? false : { scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-seafoam border-[2.5px] border-ink flex items-center justify-center shadow-[2px_2px_0_#17171C] ring-[3px] ring-butter ring-offset-2 ring-offset-chalk"
                      title={`${inc.title} (Completed - Zero rewinds!)`}
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-ink fill-butter" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-seafoam border-[2.5px] border-ink flex items-center justify-center shadow-[2px_2px_0_#17171C]"
                      title={`${inc.title} (Completed)`}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-ink" strokeWidth={2.5} />
                    </div>
                  )
                ) : isCurrent ? (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-butter border-[2.5px] border-ink flex items-center justify-center shadow-[3px_3px_0_#17171C] animate-pulse"
                    title={`${inc.title} (Current)`}
                  >
                    <span className="font-display font-extrabold text-[18px] sm:text-[20px] text-ink leading-none">
                      {idx + 1}
                    </span>
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone/40 border-[2.5px] border-ink/40 flex items-center justify-center text-mute"
                    title={`${inc.title} (Locked)`}
                  >
                    <Lock className="w-4 h-4 text-ink/60" strokeWidth={2.5} />
                  </div>
                )}

                {/* Title under the current node only */}
                {isCurrent && (
                  <div className="absolute top-12 whitespace-nowrap text-center">
                    <span className="font-sans font-semibold text-[13px] sm:text-[14px] text-ink tracking-tight">
                      {inc.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Connecting line */}
              {showConnector && (
                <div className="flex-1 flex items-center justify-center mx-1 sm:mx-2">
                  {nextIsLocked ? (
                    <div className="w-full border-t-[3px] border-dashed border-ink" />
                  ) : (
                    <div className="w-full h-[3px] bg-ink" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Spacer to prevent title clipping */}
      <div className="h-6" />
    </div>
  );
}
