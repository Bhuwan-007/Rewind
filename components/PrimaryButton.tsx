import React from "react";

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  className = "",
  fullWidth = false,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        h-[56px] px-6
        text-ink font-semibold text-[18px] leading-none
        border-[2.5px] border-ink rounded-[14px]
        ${fullWidth ? "w-full" : "w-auto"}
        ${
          disabled
            ? "bg-stone cursor-not-allowed shadow-none opacity-80"
            : "bg-butter cursor-pointer shadow-btn hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#17171C] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-75"
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
