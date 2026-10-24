"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getGameStateSnapshot,
  getServerSnapshot,
  subscribeToStore,
  clearGameState,
} from "@/lib/store";
import { Flame, Star, Rewind } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Stable snapshot cached in lib/store.ts prevents infinite loop
  const state = useSyncExternalStore(
    subscribeToStore,
    getGameStateSnapshot,
    getServerSnapshot
  );

  const streak = state.streak;
  const score = state.score;
  const tokens = state.tokens;

  const isCaseActive = pathname?.startsWith("/case");
  const isCurveActive = pathname?.startsWith("/curve");
  const isNewSkillActive = pathname === "/";

  const handleNewSkillClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      clearGameState();
      window.location.reload();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-ink text-chalk z-50 flex items-center justify-between px-4 sm:px-8 border-b-2 border-ink">
        {/* Left: Logo with Rewind Icon */}
        <div
          onClick={() => router.push("/")}
          className="cursor-pointer flex items-center gap-2.5 group select-none"
        >
          <span className="w-8 h-8 rounded-[9px] bg-butter border-[2.5px] border-ink flex items-center justify-center text-ink shadow-[2px_2px_0_#17171C] group-hover:scale-105 transition-transform">
            <Rewind className="w-4 h-4 fill-ink" strokeWidth={2.5} />
          </span>
          <span className="font-display font-extrabold text-[22px] tracking-[-0.01em] text-chalk">
            Rewind
          </span>
        </div>

        {/* Center: Desktop Nav (max 3 links) */}
        <nav className="hidden md:flex items-center gap-2 font-sans font-semibold text-[15px]">
          <button
            type="button"
            onClick={() => router.push("/case")}
            className={`px-4 py-1.5 rounded-full border-[2px] transition-all cursor-pointer ${
              isCaseActive
                ? "bg-butter text-ink border-ink shadow-[2px_2px_0_#000]"
                : "border-transparent text-chalk hover:bg-mute/40"
            }`}
          >
            Case
          </button>
          <button
            type="button"
            onClick={() => router.push("/curve")}
            className={`px-4 py-1.5 rounded-full border-[2px] transition-all cursor-pointer ${
              isCurveActive
                ? "bg-butter text-ink border-ink shadow-[2px_2px_0_#000]"
                : "border-transparent text-chalk hover:bg-mute/40"
            }`}
          >
            Curve
          </button>
          <button
            type="button"
            onClick={handleNewSkillClick}
            className={`px-4 py-1.5 rounded-full border-[2px] transition-all cursor-pointer ${
              isNewSkillActive
                ? "bg-butter text-ink border-ink shadow-[2px_2px_0_#000]"
                : "border-transparent text-chalk hover:bg-mute/40"
            }`}
          >
            New skill
          </button>
        </nav>

        {/* Right: Stats Cluster */}
        <div className="flex items-center gap-3.5 sm:gap-5 select-none">
          {/* Streak: Flame */}
          <div className="flex items-center gap-1.5 font-mono text-[16px] font-semibold text-butter" title="Day Streak">
            <Flame className="w-5 h-5 fill-butter text-butter" strokeWidth={2.5} />
            <span>{streak}</span>
          </div>

          {/* Score: Star */}
          <div className="flex items-center gap-1.5 font-mono text-[16px] font-semibold text-chalk" title="Total Score">
            <Star className="w-5 h-5 fill-butter text-butter" strokeWidth={2.5} />
            <span>{score}</span>
          </div>

          {/* Rewind Tokens: 3 Frost Circles */}
          <div className="flex items-center gap-1.5" title={`${tokens} Rewind Tokens Remaining`}>
            {[0, 1, 2].map((idx) => {
              const isAvailable = idx < tokens;
              return (
                <span
                  key={idx}
                  className={`
                    w-6 h-6 rounded-full border-[2px] border-ink flex items-center justify-center
                    ${
                      isAvailable
                        ? "bg-frost text-ink shadow-[1px_1px_0_#17171C]"
                        : "bg-stone/30 border-stone/50 text-transparent"
                    }
                    transition-all
                  `}
                >
                  {isAvailable && <Rewind className="w-3 h-3 fill-ink text-ink" strokeWidth={2.5} />}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-ink text-chalk z-50 flex items-center justify-around px-4 border-t-2 border-ink">
        <button
          type="button"
          onClick={() => router.push("/case")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold ${
            isCaseActive ? "bg-butter text-ink" : "text-chalk"
          }`}
        >
          Case
        </button>
        <button
          type="button"
          onClick={() => router.push("/curve")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold ${
            isCurveActive ? "bg-butter text-ink" : "text-chalk"
          }`}
        >
          Curve
        </button>
        <button
          type="button"
          onClick={handleNewSkillClick}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold ${
            isNewSkillActive ? "bg-butter text-ink" : "text-chalk"
          }`}
        >
          New skill
        </button>
      </nav>
    </>
  );
}
