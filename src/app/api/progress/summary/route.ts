// @ts-nocheck
// ============================================================================
// Progress Summary API
// GET /api/progress/summary
// Returns complete progress data for the "My Progress" tab
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLevelInfo, getMilestoneInfo } from "../lib/xpCalculator";
import { getStreakInfo, isStreakAtRisk } from "../lib/streakEvaluator";
import { getAchievementsWithStatus } from "../lib/achievementEvaluator";

interface ProgressSummaryResponse {
    success: boolean;
    data?: {
        xp: {
            total: number;
            level: number;
            xpToNextLevel: number;
            xpForCurrentLevel: number;
            levelProgress: number;
            milestones: Array<{ level: number; totalXp: number; effort: string }>;
        };
        streak: {
            current: number;
            longest: number;
            lastActivityDate: string | null;
            atRisk: boolean;
        };
        achievements: {
            list: Array<{
                id: string;
                slug: string;
                title: string;
                description: string;
                type: string;
                xpReward: number;
                rarity: string;
                icon: string;
                color: string;
                progress: number;
                isUnlocked: boolean;
                unlockedAt: string | null;
            }>;
            unlockedCount: number;
            totalCount: number;
        };
        skills: {
            topSkills: Array<{
                id: string;
                name: string;
                category: string;
                proficiency: string;
                xpEarned: number;
            }>;
            totalSkills: number;
        };
        paths: {
            active: Array<{
                id: string;
                pathId: string;
                title: string;
                description: string | null;
                status: string;
                progressPercent: number;
                startedAt: string;
            }>;
            completed: Array<{
                id: string;
                pathId: string;
                title: string;
                description: string | null;
                status: string;
                progressPercent: number;
                startedAt: string;
                completedAt: string | null;
            }>;
        };
        stats: {
            chaptersCompleted: number;
            coursesCompleted: number;
            totalLearningTime: number;
        };
    };
    error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ProgressSummaryResponse>> {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized",
            }, { status: 401 });
        }

        // Fetch user profile
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("total_xp, current_streak, longest_streak, last_completed_at, timezone")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({
                success: false,
                error: "Profile not found",
            }, { status: 404 });
        }

        // Calculate level info
        const levelInfo = getLevelInfo(profile.total_xp || 0);
        const milestones = getMilestoneInfo();

        // Get streak info
        const streakInfo = await getStreakInfo(user.id);
        const atRisk = isStreakAtRisk(streakInfo.lastCompletedAt, streakInfo.timezone);

        // Get achievements with status
        const achievements = await getAchievementsWithStatus(user.id);
        const unlockedCount = achievements.filter(a => a.isUnlocked).length;

        // Get user skills
        const { data: skills } = await supabase
            .from("user_skills")
            .select(`
                id,
                skill_id,
                proficiency,
                xp_earned,
                skills (
                    name,
                    category
                )
            `)
            .eq("user_id", user.id)
            .order("xp_earned", { ascending: false })
            .limit(5);

        // Get learning path enrollments
        const { data: enrollments } = await supabase
            .from("learning_path_enrollments")
            .select(`
                id,
                learning_path_id,
                status,
                progress_percent,
                started_at,
                completed_at,
                learning_paths (
                    title,
                    description
                )
            `)
            .eq("user_id", user.id)
            .order("started_at", { ascending: false });

        const activePaths = (enrollments || [])
            .filter(e => e.status === "active" || e.status === "in_progress")
            .map(e => ({
                id: e.id,
                pathId: e.learning_path_id,
                title: (e.learning_paths as any)?.title || "Unknown Path",
                description: (e.learning_paths as any)?.description || null,
                status: e.status,
                progressPercent: e.progress_percent,
                startedAt: e.started_at,
            }));

        const completedPaths = (enrollments || [])
            .filter(e => e.status === "completed")
            .map(e => ({
                id: e.id,
                pathId: e.learning_path_id,
                title: (e.learning_paths as any)?.title || "Unknown Path",
                description: (e.learning_paths as any)?.description || null,
                status: e.status,
                progressPercent: e.progress_percent,
                startedAt: e.started_at,
                completedAt: e.completed_at,
            }));

        // Get stats
        const { count: chaptersCompleted } = await supabase
            .from("chapter_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed");

        const { count: coursesCompleted } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed");

        // Estimate learning time from section progress (rough estimate: 5 min per section)
        const { count: sectionsCompleted } = await supabase
            .from("section_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed");

        const totalLearningTime = (sectionsCompleted || 0) * 5;

        return NextResponse.json({
            success: true,
            data: {
                xp: {
                    total: profile.total_xp || 0,
                    level: levelInfo.level,
                    xpToNextLevel: levelInfo.xpToNextLevel,
                    xpForCurrentLevel: levelInfo.xpForCurrentLevel,
                    levelProgress: levelInfo.progressPercent,
                    milestones,
                },
                streak: {
                    current: profile.current_streak || 0,
                    longest: profile.longest_streak || 0,
                    lastActivityDate: profile.last_completed_at,
                    atRisk,
                },
                achievements: {
                    list: achievements.map(a => ({
                        id: a.id,
                        slug: a.slug,
                        title: a.title,
                        description: a.description,
                        type: a.achievement_type,
                        xpReward: a.xp_reward,
                        rarity: a.rarity,
                        icon: a.icon,
                        color: a.color,
                        progress: a.progress,
                        isUnlocked: a.isUnlocked,
                        unlockedAt: a.unlockedAt,
                    })),
                    unlockedCount,
                    totalCount: achievements.length,
                },
                skills: {
                    topSkills: (skills || []).map(s => ({
                        id: s.id,
                        name: (s.skills as any)?.name || "Unknown",
                        category: (s.skills as any)?.category || "unknown",
                        proficiency: s.proficiency,
                        xpEarned: s.xp_earned || 0,
                    })),
                    totalSkills: skills?.length || 0,
                },
                paths: {
                    active: activePaths,
                    completed: completedPaths,
                },
                stats: {
                    chaptersCompleted: chaptersCompleted || 0,
                    coursesCompleted: coursesCompleted || 0,
                    totalLearningTime,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching progress summary:", error);
        return NextResponse.json({
            success: false,
            error: "Internal server error",
        }, { status: 500 });
    }
}
