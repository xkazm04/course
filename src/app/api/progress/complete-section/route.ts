// @ts-nocheck
// ============================================================================
// Complete Section API
// POST /api/progress/complete-section
// Marks a section as complete, awards XP, updates streak, checks achievements
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLevelInfo, checkLevelUp, applyStreakBonus } from "../lib/xpCalculator";
import { evaluateStreak } from "../lib/streakEvaluator";
import { evaluateAchievements, type Achievement } from "../lib/achievementEvaluator";

interface CompleteSectionRequest {
    sectionId: string;
    courseId: string;
    chapterId: string;
    quizScore?: number;
}

interface CompleteSectionResponse {
    success: boolean;
    xpAwarded: number;
    bonusXp: number;
    totalXp: number;
    newLevel?: number;
    leveledUp: boolean;
    streak: {
        current: number;
        longest: number;
        updated: boolean;
        wasReset: boolean;
    };
    achievementsUnlocked: Achievement[];
    chapterCompleted: boolean;
    courseCompleted: boolean;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CompleteSectionResponse>> {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({
                success: false,
                xpAwarded: 0,
                bonusXp: 0,
                totalXp: 0,
                leveledUp: false,
                streak: { current: 0, longest: 0, updated: false, wasReset: false },
                achievementsUnlocked: [],
                chapterCompleted: false,
                courseCompleted: false,
                error: "Unauthorized",
            }, { status: 401 });
        }

        // Parse request body
        const body = await request.json() as CompleteSectionRequest;
        const { sectionId, courseId, chapterId, quizScore } = body;

        if (!sectionId || !courseId || !chapterId) {
            return NextResponse.json({
                success: false,
                xpAwarded: 0,
                bonusXp: 0,
                totalXp: 0,
                leveledUp: false,
                streak: { current: 0, longest: 0, updated: false, wasReset: false },
                achievementsUnlocked: [],
                chapterCompleted: false,
                courseCompleted: false,
                error: "Missing required fields",
            }, { status: 400 });
        }

        // Check if section is already completed (idempotency)
        const { data: existingProgress } = await supabase
            .from("section_progress")
            .select("id, status, xp_earned")
            .eq("user_id", user.id)
            .eq("section_id", sectionId)
            .single();

        if (existingProgress?.status === "completed") {
            // Already completed - return current state without changes
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("total_xp, current_streak, longest_streak")
                .eq("id", user.id)
                .single();

            return NextResponse.json({
                success: true,
                xpAwarded: 0,
                bonusXp: 0,
                totalXp: profile?.total_xp || 0,
                leveledUp: false,
                streak: {
                    current: profile?.current_streak || 0,
                    longest: profile?.longest_streak || 0,
                    updated: false,
                    wasReset: false,
                },
                achievementsUnlocked: [],
                chapterCompleted: false,
                courseCompleted: false,
            });
        }

        // Get section info for XP reward
        const { data: section } = await supabase
            .from("sections")
            .select("xp_reward")
            .eq("id", sectionId)
            .single();

        const baseXp = section?.xp_reward || 10;

        // Get user's current profile for streak calculation
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("total_xp, current_streak, longest_streak")
            .eq("id", user.id)
            .single();

        const previousXp = profile?.total_xp || 0;
        const currentStreak = profile?.current_streak || 0;

        // Calculate XP with streak bonus
        const { totalXp: xpWithBonus, bonusXp } = applyStreakBonus(baseXp, currentStreak);

        // Update section_progress
        await supabase
            .from("section_progress")
            .upsert({
                user_id: user.id,
                section_id: sectionId,
                status: "completed",
                progress_percent: 100,
                xp_earned: xpWithBonus,
                quiz_score: quizScore,
                completed_at: new Date().toISOString(),
            }, {
                onConflict: "user_id,section_id",
            });

        // Update user's total XP
        const newTotalXp = previousXp + xpWithBonus;
        await supabase
            .from("user_profiles")
            .update({ total_xp: newTotalXp })
            .eq("id", user.id);

        // Evaluate streak
        const streakResult = await evaluateStreak(user.id);

        // Check if chapter is completed
        const chapterComplete = await checkChapterCompletion(supabase, user.id, chapterId);

        // If chapter complete, award chapter XP and update progress
        let chapterXpAwarded = 0;
        if (chapterComplete.justCompleted) {
            const { data: chapter } = await supabase
                .from("chapters")
                .select("xp_reward")
                .eq("id", chapterId)
                .single();

            chapterXpAwarded = chapter?.xp_reward || 50;

            // Update chapter_progress
            await supabase
                .from("chapter_progress")
                .upsert({
                    user_id: user.id,
                    chapter_id: chapterId,
                    status: "completed",
                    sections_completed: chapterComplete.sectionsCompleted,
                    total_sections: chapterComplete.totalSections,
                    xp_earned: chapterXpAwarded,
                    completed_at: new Date().toISOString(),
                }, {
                    onConflict: "user_id,chapter_id",
                });

            // Add chapter XP
            await supabase
                .from("user_profiles")
                .update({ total_xp: newTotalXp + chapterXpAwarded })
                .eq("id", user.id);
        }

        // Check for level up
        const finalXp = newTotalXp + chapterXpAwarded;
        const levelUpResult = checkLevelUp(previousXp, finalXp);

        // Evaluate achievements
        const achievementResult = await evaluateAchievements(user.id, {
            type: chapterComplete.justCompleted ? "chapter_completed" : "chapter_completed",
            chaptersCompleted: chapterComplete.totalChaptersCompleted,
            streakDays: streakResult.current,
        });

        // Check if course is completed
        const courseComplete = await checkCourseCompletion(supabase, user.id, courseId);

        return NextResponse.json({
            success: true,
            xpAwarded: xpWithBonus + chapterXpAwarded + achievementResult.totalXpEarned,
            bonusXp,
            totalXp: finalXp + achievementResult.totalXpEarned,
            newLevel: levelUpResult.leveledUp ? levelUpResult.newLevel : undefined,
            leveledUp: levelUpResult.leveledUp,
            streak: {
                current: streakResult.current,
                longest: streakResult.longest,
                updated: streakResult.updated,
                wasReset: streakResult.wasReset,
            },
            achievementsUnlocked: achievementResult.newlyUnlocked,
            chapterCompleted: chapterComplete.justCompleted,
            courseCompleted: courseComplete.justCompleted,
        });
    } catch (error) {
        console.error("Error completing section:", error);
        return NextResponse.json({
            success: false,
            xpAwarded: 0,
            bonusXp: 0,
            totalXp: 0,
            leveledUp: false,
            streak: { current: 0, longest: 0, updated: false, wasReset: false },
            achievementsUnlocked: [],
            chapterCompleted: false,
            courseCompleted: false,
            error: "Internal server error",
        }, { status: 500 });
    }
}

/**
 * Check if all sections in a chapter are completed
 */
async function checkChapterCompletion(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    chapterId: string
): Promise<{ justCompleted: boolean; sectionsCompleted: number; totalSections: number; totalChaptersCompleted: number }> {
    // Get total sections in chapter
    const { count: totalSections } = await supabase
        .from("sections")
        .select("*", { count: "exact", head: true })
        .eq("chapter_id", chapterId);

    // Get completed sections for this user in this chapter
    const { count: completedSections } = await supabase
        .from("section_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .in("section_id",
            // Subquery to get section IDs for this chapter
            supabase.from("sections").select("id").eq("chapter_id", chapterId)
        );

    // Check if chapter was already marked complete
    const { data: existingChapterProgress } = await supabase
        .from("chapter_progress")
        .select("status")
        .eq("user_id", userId)
        .eq("chapter_id", chapterId)
        .single();

    // Get total chapters completed
    const { count: totalChaptersCompleted } = await supabase
        .from("chapter_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

    const isComplete = (completedSections || 0) >= (totalSections || 1);
    const wasAlreadyComplete = existingChapterProgress?.status === "completed";

    return {
        justCompleted: isComplete && !wasAlreadyComplete,
        sectionsCompleted: completedSections || 0,
        totalSections: totalSections || 0,
        totalChaptersCompleted: (totalChaptersCompleted || 0) + (isComplete && !wasAlreadyComplete ? 1 : 0),
    };
}

/**
 * Check if all chapters in a course are completed
 */
async function checkCourseCompletion(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    courseId: string
): Promise<{ justCompleted: boolean }> {
    // Get total chapters in course
    const { count: totalChapters } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId);

    // Get completed chapters for this user in this course
    const { data: chapters } = await supabase
        .from("chapters")
        .select("id")
        .eq("course_id", courseId);

    const chapterIds = chapters?.map(c => c.id) || [];

    const { count: completedChapters } = await supabase
        .from("chapter_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .in("chapter_id", chapterIds);

    // Check if enrollment already marked as complete
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("status")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

    const isComplete = (completedChapters || 0) >= (totalChapters || 1);
    const wasAlreadyComplete = enrollment?.status === "completed";

    if (isComplete && !wasAlreadyComplete) {
        // Mark enrollment as complete
        await supabase
            .from("enrollments")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                progress_percent: 100,
            })
            .eq("user_id", userId)
            .eq("course_id", courseId);
    }

    return {
        justCompleted: isComplete && !wasAlreadyComplete,
    };
}
