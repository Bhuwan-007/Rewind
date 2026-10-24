import React from "react";
import { Check, X } from "lucide-react";

export type OptionState = "default" | "selected" | "correct" | "wrong" | "faded";

export interface OptionButtonProps {
  letter: string;
  text: string;
  state?: OptionState;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function OptionButton({
  letter,
  text,
  state = "default",
  disabled = false,
  onClick,
  className = "",
}: OptionButtonProps) {
  // Color configuration by state
  let bgStyles = "bg-paper hover:bg-butter";
  let opacityStyles = "opacity-100";
  let cursorStyles = "cursor-pointer";

  if (state === "selected") {
    bgStyles = "bg-butter";
  } else if (state === "correct") {
    bgStyles = "bg-seafoam";
    cursorStyles = "cursor-default";
  } else if (state === "wrong") {
    bgStyles = "bg-flamingo";
    cursorStyles = "cursor-default";
  } else if (state === "faded") {
    bgStyles = "bg-paper";
    opacityStyles = "opacity-40";
    cursorStyles = "cursor-default";
  }

  if (disabled && state === "default") {
    cursorStyles = "cursor-not-allowed opacity-60";
  }

  return (
    <button
      type="button"
      onClick={disabled || state === "faded" ? undefined : onClick}
      disabled={disabled && state === "default"}
      className={`
        w-full text-left
        p-4 min-h-[64px]
        border-[2.5px] border-ink rounded-[14px]
        text-ink font-sans font-medium text-[16px] sm:text-[18px] leading-[24px]
        shadow-btn
        flex items-center gap-3.5
        ${bgStyles}
        ${opacityStyles}
        ${cursorStyles}
        ${
          state === "default" && !disabled
            ? "hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#17171C] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            : ""
        }
        transition-all duration-75
        ${className}
      `}
    >
      {/* Letter badge in Chalk circle */}
      <span
        className={`
          flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9
          rounded-full border-[2px] border-ink
          font-display font-bold text-[15px] sm:text-[16px]
          flex items-center justify-center
          ${
            state === "correct"
              ? "bg-ink text-seafoam"
              : state === "wrong"
              ? "bg-ink text-flamingo"
              : "bg-chalk text-ink"
          }
        `}
      >
        {state === "correct" ? (
          <Check className="w-5 h-5 text-seafoam" strokeWidth={2.5} />
        ) : state === "wrong" ? (
          <X className="w-5 h-5 text-flamingo" strokeWidth={2.5} />
        ) : (
          letter
        )}
      </span>

      {/* Option body text */}
      <span className="flex-1">{text}</span>
    </button>
  );
}
