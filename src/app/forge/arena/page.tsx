"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useLeaderboard } from "@/app/features/competition";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

// Dynamic import for 3D components to avoid SSR issues
const ChampionshipArena = dynamic(
    () => import("@/app/features/competition/components/Arena3D/ChampionshipArena").then(mod => mod.ChampionshipArena),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] rounded-xl bg-[var(--forge-bg-void)] flex items-center justify-center border border-[var(--forge-border-default)]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--ember)] mx-auto mb-4" />
                    <p className="text-[var(--forge-text-muted)]">Loading 3D Arena...</p>
                </div>
            </div>
        ),
    }
);

export default function ArenaPage() {
    // Use a mock challenge ID for demo
    const { entries, isLoading, totalParticipants } = useLeaderboard({
        challengeId: "sprint-1",
        autoRefresh: true,
        refreshInterval: 10000,
    });

    const handleCompetitorSelect = (userId: string) => {
        console.log("Selected competitor:", userId);
    };

    return (
        <div className="min-h-screen bg-[var(--forge-bg-void)] p-4 md:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/forge"
                        className="p-2 rounded-lg bg-[var(--forge-bg-workshop)] hover:bg-[var(--forge-bg-bench)] transition-colors text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        data-testid="arena-back-btn"
                    >
                        <ArrowLeft size={ICON_SIZES.md} />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--forge-text-primary)] flex items-center gap-3">
                            <Trophy className="text-[var(--forge-warning)]" />
                            Championship Arena
                        </h1>
                        <p className="text-[var(--forge-text-muted)] mt-1">
                            Watch competitors climb, battle, and evolve in real-time
                        </p>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap gap-4">
                    <div className="px-4 py-2 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                        <span className="text-[var(--forge-text-muted)] text-sm">Competitors</span>
                        <p className="text-lg font-semibold text-[var(--forge-text-primary)]">
                            {totalParticipants}
                        </p>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                        <span className="text-[var(--forge-text-muted)] text-sm">Challenge</span>
                        <p className="text-lg font-semibold text-[var(--forge-text-primary)]">
                            API Sprint #1
                        </p>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                        <span className="text-[var(--forge-text-muted)] text-sm">Status</span>
                        <p className="text-lg font-semibold text-[var(--forge-success)]">
                            Live
                        </p>
                    </div>
                </div>
            </header>

            {/* 3D Arena */}
            <Suspense fallback={
                <div className="w-full h-[600px] rounded-xl bg-[var(--forge-bg-void)] flex items-center justify-center border border-[var(--forge-border-default)]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-[var(--ember)] mx-auto mb-4" />
                        <p className="text-[var(--forge-text-muted)]">Loading 3D Arena...</p>
                    </div>
                </div>
            }>
                {!isLoading && entries.length > 0 ? (
                    <ChampionshipArena
                        entries={entries}
                        challengeId="sprint-1"
                        onCompetitorSelect={handleCompetitorSelect}
                        initialViewMode="podium"
                    />
                ) : (
                    <div className="w-full h-[600px] rounded-xl bg-[var(--forge-bg-void)] flex items-center justify-center border border-[var(--forge-border-default)]">
                        <div className="text-center">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-12 h-12 animate-spin text-[var(--ember)] mx-auto mb-4" />
                                    <p className="text-[var(--forge-text-muted)]">Loading competitors...</p>
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-12 h-12 text-[var(--forge-text-muted)] mx-auto mb-4" />
                                    <p className="text-[var(--forge-text-muted)]">No competitors yet</p>
                                    <p className="text-sm text-[var(--forge-text-muted)] mt-1">
                                        Join a challenge to see the arena come alive
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Suspense>

            {/* Instructions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                    <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">Controls</h3>
                    <ul className="text-sm text-[var(--forge-text-muted)] space-y-1">
                        <li>Drag to rotate the view</li>
                        <li>Scroll to zoom in/out</li>
                        <li>Click on avatars to select</li>
                        <li>Use view buttons to change perspective</li>
                    </ul>
                </div>
                <div className="p-4 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                    <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">Tier Armor</h3>
                    <ul className="text-sm text-[var(--forge-text-muted)] space-y-1">
                        <li><span className="text-[#CD7F32]">Bronze</span> - Basic appearance</li>
                        <li><span className="text-[#C0C0C0]">Silver</span> - Helmet + sparks</li>
                        <li><span className="text-[#FFD700]">Gold</span> - Crown + shoulder pads</li>
                        <li><span className="text-[#E5E4E2]">Platinum</span> - Cape + glowing aura</li>
                        <li><span className="text-[#B9F2FF]">Diamond</span> - Crystal + lightning</li>
                        <li><span className="text-[#FF4500]">Master</span> - Legendary + cosmic</li>
                    </ul>
                </div>
                <div className="p-4 rounded-lg bg-[var(--forge-bg-workshop)] border border-[var(--forge-border-subtle)]">
                    <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">VR Mode</h3>
                    <ul className="text-sm text-[var(--forge-text-muted)] space-y-1">
                        <li>Click &quot;Enter VR&quot; for immersive view</li>
                        <li>Compatible with Meta Quest</li>
                        <li>Use controllers to teleport</li>
                        <li>Point at avatars to see info</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
