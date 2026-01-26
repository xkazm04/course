"use client";

import { TreemapContainer } from "@/app/features/treemap-navigator";

/**
 * Territories Map Page
 *
 * Treemap-based navigation for exploring the course catalog.
 * Click territories to drill down, press Escape to go back.
 */
export default function TerritoriesPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <header className="flex-none p-4 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-white">Knowledge Territories</h1>
        <p className="text-sm text-white/60">
          Click territories to explore. Press Escape to go back.
        </p>
      </header>

      {/* Main content - treemap fills remaining space */}
      <main className="flex-1 relative">
        <TreemapContainer />
      </main>
    </div>
  );
}
