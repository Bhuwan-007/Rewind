import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-paper border-[2.5px] border-ink rounded-[20px] shadow-card text-ink p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
