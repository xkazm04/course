"use client";

import React, { useState, useCallback, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, PerspectiveCamera, Environment, Stars } from "@react-three/drei";
import { XRButton, XR } from "@react-three/xr";
import { LeaderboardEntry } from "../../lib/types";
import {
    ArenaCompetitor,
    ArenaViewMode,
    VRConfig,
    getArenaPositionForRank,
    getRankChangeAnimation,
    TIER_ARMOR_CONFIGS,
} from "../../lib/arenaTypes";
import { ArenaEnvironment } from "./ArenaEnvironment";
import { Podiums } from "./Podium";
import { CompetitorAvatar } from "./CompetitorAvatar";
import { RankAnimationWrapper, CelebrationEffect } from "./RankAnimations";
import { VRModeManager, DesktopCameraControls, VREntryButton } from "./VRControls";
import { cn } from "@/app/shared/lib/utils";
import { Trophy, Maximize2, Camera, Users, Gamepad2 } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface ChampionshipArenaProps {
    entries: LeaderboardEntry[];
    challengeId: string;
    className?: string;
    onCompetitorSelect?: (userId: string) => void;
    initialViewMode?: ArenaViewMode;
}

// Loading fallback
const ArenaLoader: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--forge-bg-void)]">
        <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--ember)] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[var(--forge-text-muted)]">Loading Arena...</p>
        </div>
    </div>
);

// View mode button
interface ViewModeButtonProps {
    mode: ArenaViewMode;
    currentMode: ArenaViewMode;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const ViewModeButton: React.FC<ViewModeButtonProps> = ({
    mode,
    currentMode,
    icon,
    label,
    onClick,
}) => (
    <button
        onClick={onClick}
        className={cn(
            "px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm",
            currentMode === mode
                ? "bg-[var(--ember)] text-white shadow-ember-sm"
                : "bg-[var(--forge-bg-workshop)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
        )}
        data-testid={`arena-view-${mode}-btn`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

// Convert leaderboard entries to arena competitors
function entriesToCompetitors(entries: LeaderboardEntry[]): ArenaCompetitor[] {
    return entries.map((entry) => {
        const position = getArenaPositionForRank(entry.rank, entries.length);
        const animation = getRankChangeAnimation(entry, entry.previousRank);

        return {
            ...entry,
            position,
            armor: TIER_ARMOR_CONFIGS[entry.tier],
            animation,
            isAnimating: animation !== null,
        };
    });
}

// 3D Scene content
interface ArenaSceneProps {
    competitors: ArenaCompetitor[];
    selectedCompetitor: string | null;
    onSelectCompetitor: (userId: string | null) => void;
    viewMode: ArenaViewMode;
    vrEnabled: boolean;
}

const ArenaScene: React.FC<ArenaSceneProps> = ({
    competitors,
    selectedCompetitor,
    onSelectCompetitor,
    viewMode,
    vrEnabled,
}) => {
    // Camera positions for different view modes
    const cameraPosition = useMemo(() => {
        switch (viewMode) {
            case "podium":
                return [0, 8, 15] as [number, number, number];
            case "stadium":
                return [0, 25, 35] as [number, number, number];
            case "orbital":
                return [20, 15, 20] as [number, number, number];
            default:
                return [0, 8, 15] as [number, number, number];
        }
    }, [viewMode]);

    return (
        <>
            {/* Camera */}
            <PerspectiveCamera
                makeDefault
                position={cameraPosition}
                fov={60}
                near={0.1}
                far={1000}
            />

            {/* Environment lighting */}
            <Environment preset="night" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Arena environment */}
            <ArenaEnvironment />

            {/* Podiums for top 3 */}
            <Podiums />

            {/* All competitors */}
            {competitors.map((competitor) => {
                const isSelected = competitor.userId === selectedCompetitor;

                if (competitor.animation) {
                    return (
                        <RankAnimationWrapper
                            key={competitor.userId}
                            animation={competitor.animation}
                            onComplete={() => {
                                // Animation complete callback
                            }}
                        >
                            <CompetitorAvatar
                                competitor={competitor}
                                isSelected={isSelected}
                                onClick={() => onSelectCompetitor(isSelected ? null : competitor.userId)}
                            />
                            {competitor.animation.type === "celebrate" && (
                                <CelebrationEffect
                                    position={competitor.position}
                                    color={TIER_ARMOR_CONFIGS[competitor.tier].aura || "#FFD700"}
                                />
                            )}
                        </RankAnimationWrapper>
                    );
                }

                return (
                    <CompetitorAvatar
                        key={competitor.userId}
                        competitor={competitor}
                        isSelected={isSelected}
                        onClick={() => onSelectCompetitor(isSelected ? null : competitor.userId)}
                    />
                );
            })}

            {/* Desktop camera controls */}
            <DesktopCameraControls enabled={!vrEnabled} />
        </>
    );
};

// Main Championship Arena component
export const ChampionshipArena: React.FC<ChampionshipArenaProps> = ({
    entries,
    challengeId,
    className,
    onCompetitorSelect,
    initialViewMode = "podium",
}) => {
    const [viewMode, setViewMode] = useState<ArenaViewMode>(initialViewMode);
    const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
    const [vrConfig, setVrConfig] = useState<VRConfig>({
        enabled: false,
        handTracking: true,
        teleportEnabled: true,
        interactionDistance: 5,
    });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Convert entries to arena competitors
    const competitors = useMemo(() => entriesToCompetitors(entries), [entries]);

    // Handle competitor selection
    const handleSelectCompetitor = useCallback(
        (userId: string | null) => {
            setSelectedCompetitor(userId);
            if (userId && onCompetitorSelect) {
                onCompetitorSelect(userId);
            }
        },
        [onCompetitorSelect]
    );

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Toggle VR mode
    const toggleVR = useCallback(() => {
        setVrConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    // Get selected competitor data
    const selectedData = useMemo(
        () => competitors.find((c) => c.userId === selectedCompetitor),
        [competitors, selectedCompetitor]
    );

    return (
        <div
            className={cn(
                "relative w-full h-[600px] rounded-xl overflow-hidden border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-void)]",
                isFullscreen && "h-screen rounded-none",
                className
            )}
            data-testid="championship-arena"
        >
            {/* Header controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                {/* Title */}
                <div className="flex items-center gap-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-[var(--forge-border-subtle)]">
                    <Trophy size={ICON_SIZES.md} className="text-[var(--forge-warning)]" />
                    <span className="font-semibold text-[var(--forge-text-primary)]">
                        Championship Arena
                    </span>
                    <span className="text-sm text-[var(--forge-text-muted)]">
                        ({entries.length} competitors)
                    </span>
                </div>

                {/* View mode controls */}
                <div className="flex items-center gap-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm p-1 rounded-lg border border-[var(--forge-border-subtle)]">
                    <ViewModeButton
                        mode="podium"
                        currentMode={viewMode}
                        icon={<Trophy size={ICON_SIZES.sm} />}
                        label="Podium"
                        onClick={() => setViewMode("podium")}
                    />
                    <ViewModeButton
                        mode="stadium"
                        currentMode={viewMode}
                        icon={<Users size={ICON_SIZES.sm} />}
                        label="Stadium"
                        onClick={() => setViewMode("stadium")}
                    />
                    <ViewModeButton
                        mode="orbital"
                        currentMode={viewMode}
                        icon={<Camera size={ICON_SIZES.sm} />}
                        label="Orbital"
                        onClick={() => setViewMode("orbital")}
                    />

                    <div className="w-px h-6 bg-[var(--forge-border-subtle)]" />

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-workshop)] transition-colors"
                        data-testid="arena-fullscreen-btn"
                    >
                        <Maximize2 size={ICON_SIZES.sm} />
                    </button>
                </div>
            </div>

            {/* Selected competitor info panel */}
            {selectedData && (
                <div className="absolute bottom-20 left-4 z-10 bg-[var(--forge-bg-elevated)]/95 backdrop-blur-sm p-4 rounded-lg border border-[var(--forge-border-default)] max-w-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            style={{ backgroundColor: TIER_ARMOR_CONFIGS[selectedData.tier].aura || "#666" }}
                        >
                            #{selectedData.rank}
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--forge-text-primary)]">
                                @{selectedData.displayName}
                            </p>
                            <p className="text-sm text-[var(--forge-text-muted)] capitalize">
                                {selectedData.tier} Tier
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-[var(--forge-text-muted)]">Score</p>
                            <p className="font-medium text-[var(--forge-text-primary)]">
                                {selectedData.score.toFixed(1)} pts
                            </p>
                        </div>
                        <div>
                            <p className="text-[var(--forge-text-muted)]">Trend</p>
                            <p className={cn(
                                "font-medium",
                                selectedData.trend === "up" && "text-[var(--forge-success)]",
                                selectedData.trend === "down" && "text-[var(--forge-error)]",
                                selectedData.trend === "stable" && "text-[var(--forge-text-secondary)]",
                                selectedData.trend === "new" && "text-[var(--forge-info)]"
                            )}>
                                {selectedData.trend === "up" && "Rising"}
                                {selectedData.trend === "down" && "Falling"}
                                {selectedData.trend === "stable" && "Stable"}
                                {selectedData.trend === "new" && "New Entry"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSelectCompetitor(null)}
                        className="mt-3 w-full text-center text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                        data-testid="arena-deselect-btn"
                    >
                        Click to deselect
                    </button>
                </div>
            )}

            {/* 3D Canvas */}
            <Suspense fallback={<ArenaLoader />}>
                <Canvas shadows dpr={[1, 2]}>
                    <XR>
                        <ArenaScene
                            competitors={competitors}
                            selectedCompetitor={selectedCompetitor}
                            onSelectCompetitor={handleSelectCompetitor}
                            viewMode={viewMode}
                            vrEnabled={vrConfig.enabled}
                        />
                        <Preload all />
                    </XR>
                </Canvas>
            </Suspense>

            {/* VR Entry Button */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <XRButton
                    mode="VR"
                    className="px-4 py-2 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-default)] rounded-lg text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] transition-colors flex items-center gap-2"
                >
                    <Gamepad2 size={ICON_SIZES.md} />
                    <span>Enter VR</span>
                </XRButton>
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-4 left-4 z-10 text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                <p>Drag to rotate • Scroll to zoom • Click avatar to select</p>
            </div>
        </div>
    );
};

export default ChampionshipArena;
