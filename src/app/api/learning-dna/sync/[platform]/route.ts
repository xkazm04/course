/**
 * Platform Sync API Route
 *
 * Fetches data from external platforms and returns signals for Learning DNA calculation.
 * Supports GitHub, Stack Overflow, LeetCode, and course platforms.
 */

import { NextRequest, NextResponse } from "next/server";

interface SyncRequest {
    username: string;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock GitHub data
 */
function generateMockGitHubData(username: string) {
    return {
        github: {
            publicRepos: Math.floor(Math.random() * 50) + 10,
            followers: Math.floor(Math.random() * 500) + 50,
            contributionsLastYear: Math.floor(Math.random() * 1000) + 200,
            totalPRs: Math.floor(Math.random() * 100) + 20,
            mergedPRs: Math.floor(Math.random() * 80) + 15,
            totalIssues: Math.floor(Math.random() * 50) + 10,
            languages: {
                TypeScript: 40 + Math.floor(Math.random() * 30),
                JavaScript: 10 + Math.floor(Math.random() * 20),
                Python: 5 + Math.floor(Math.random() * 15),
                CSS: Math.floor(Math.random() * 10),
            },
            totalStars: Math.floor(Math.random() * 300) + 50,
            contributedRepos: Math.floor(Math.random() * 30) + 5,
            commitStreak: Math.floor(Math.random() * 50) + 10,
        },
    };
}

/**
 * Generate mock Stack Overflow data
 */
function generateMockStackOverflowData(username: string) {
    return {
        stackoverflow: {
            reputation: Math.floor(Math.random() * 15000) + 1000,
            goldBadges: Math.floor(Math.random() * 5),
            silverBadges: Math.floor(Math.random() * 30) + 5,
            bronzeBadges: Math.floor(Math.random() * 100) + 20,
            totalAnswers: Math.floor(Math.random() * 150) + 30,
            acceptedAnswers: Math.floor(Math.random() * 80) + 15,
            totalQuestions: Math.floor(Math.random() * 30) + 5,
            topTags: [
                { name: "javascript", score: Math.floor(Math.random() * 500) + 100 },
                { name: "typescript", score: Math.floor(Math.random() * 400) + 80 },
                { name: "react", score: Math.floor(Math.random() * 300) + 60 },
                { name: "node.js", score: Math.floor(Math.random() * 200) + 40 },
                { name: "python", score: Math.floor(Math.random() * 100) + 20 },
            ],
            reach: Math.floor(Math.random() * 2000000) + 100000,
        },
    };
}

/**
 * Generate mock LeetCode data
 */
function generateMockLeetCodeData(username: string) {
    const easy = Math.floor(Math.random() * 150) + 50;
    const medium = Math.floor(Math.random() * 100) + 30;
    const hard = Math.floor(Math.random() * 40) + 5;

    return {
        leetcode: {
            totalSolved: easy + medium + hard,
            easySolved: easy,
            mediumSolved: medium,
            hardSolved: hard,
            ranking: Math.floor(Math.random() * 100000) + 10000,
            contestRating: Math.floor(Math.random() * 1500) + 1200,
            contestsAttended: Math.floor(Math.random() * 30) + 5,
            acceptanceRate: 60 + Math.random() * 20,
            streak: Math.floor(Math.random() * 30) + 5,
        },
    };
}

/**
 * Generate mock course platform data
 */
function generateMockCourseData(platform: string) {
    const coursesCompleted = Math.floor(Math.random() * 20) + 5;

    return {
        courses: {
            platform,
            coursesCompleted,
            totalHours: coursesCompleted * (2 + Math.random() * 4),
            certifications: [
                {
                    name: `${platform} Web Development Certificate`,
                    issuer: platform,
                    earnedAt: new Date(
                        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                },
            ],
            skillsLearned: [
                "web-development",
                "javascript",
                "react",
                "node",
                "databases",
            ],
            averageCompletionRate: 70 + Math.random() * 25,
        },
    };
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;
        const body = (await request.json()) as SyncRequest;
        const { username } = body;

        if (!username) {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        // In production, this would make actual API calls to the platforms
        // For now, return mock data based on the platform
        let data;

        switch (platform) {
            case "github":
                data = generateMockGitHubData(username);
                break;

            case "stackoverflow":
                data = generateMockStackOverflowData(username);
                break;

            case "leetcode":
                data = generateMockLeetCodeData(username);
                break;

            case "coursera":
            case "udemy":
            case "pluralsight":
            case "linkedin":
                data = generateMockCourseData(platform);
                break;

            case "hackerrank":
                // Similar to LeetCode
                data = generateMockLeetCodeData(username);
                break;

            case "codewars":
                // Similar to LeetCode
                data = generateMockLeetCodeData(username);
                break;

            default:
                return NextResponse.json(
                    { error: `Unsupported platform: ${platform}` },
                    { status: 400 }
                );
        }

        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

        return NextResponse.json(data);
    } catch (error) {
        console.error("[learning-dna/sync] Error:", error);
        return NextResponse.json(
            { error: "Failed to sync platform data" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const { platform } = await params;
    return NextResponse.json({
        platform,
        message: "Use POST to sync platform data",
        supportedPlatforms: [
            "github",
            "stackoverflow",
            "leetcode",
            "coursera",
            "udemy",
            "hackerrank",
            "codewars",
            "linkedin",
            "pluralsight",
        ],
    });
}
