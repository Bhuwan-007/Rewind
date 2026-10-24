import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-chalk text-ink flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <LoadingScreen
          title="Loading..."
          subtitle="Syncing incident timeline and case data..."
          step={1}
        />
      </main>
    </div>
  );
}
