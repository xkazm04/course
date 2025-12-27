// Challenge Templates - Mock challenge data

import { Challenge, Leaderboard, LeaderboardEntry, PerformanceMetrics } from "./types";

// Helper to create dates relative to now
function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function daysAgo(days: number): string {
    return daysFromNow(-days);
}

// Sample challenges
export const CHALLENGE_TEMPLATES: Challenge[] = [
    {
        id: "chat-app-2024",
        title: "Real-Time Chat Application",
        description:
            "Build a scalable real-time chat application with modern features including user authentication, live messaging, and typing indicators.",
        difficulty: "advanced",
        cycle: { type: "sprint", duration: 336 },
        startDate: daysAgo(3),
        endDate: daysFromNow(11),
        status: "active",
        specification: {
            overview:
                "Create a full-featured chat application that handles real-time messaging between users with a focus on performance and user experience.",
            technicalRequirements: [
                "Must use WebSockets or Server-Sent Events for real-time communication",
                "Messages must persist and be retrievable on page refresh",
                "Must handle at least 100 concurrent connections gracefully",
                "Implement proper error handling and reconnection logic",
            ],
            constraints: [
                "No third-party chat SDKs (build from scratch)",
                "Must be deployable as a single service",
                "Frontend must be responsive and work on mobile",
            ],
            resourceLimits: {
                maxMemoryMB: 512,
                maxCpuPercent: 50,
                maxStorageMB: 100,
                maxBandwidthMbps: 10,
                maxColdStartMs: 3000,
            },
        },
        requiredFeatures: [
            { id: "auth", name: "User Authentication", description: "Users can sign up and log in securely", testable: true, weight: 15 },
            { id: "realtime", name: "Real-time Delivery", description: "Messages appear instantly for all participants", testable: true, weight: 25 },
            { id: "typing", name: "Typing Indicators", description: "Show when other users are typing", testable: true, weight: 10 },
            { id: "persist", name: "Message Persistence", description: "Messages survive page refresh", testable: true, weight: 20 },
            { id: "rooms", name: "Chat Rooms", description: "Support multiple chat rooms", testable: true, weight: 15 },
            { id: "presence", name: "Online Presence", description: "Show who is online", testable: true, weight: 15 },
        ],
        bonusObjectives: [
            { id: "e2e", name: "End-to-End Encryption", description: "Encrypt messages client-side", points: 100 },
            { id: "files", name: "File Sharing", description: "Allow image/file uploads", points: 75 },
            { id: "reactions", name: "Message Reactions", description: "Add emoji reactions to messages", points: 50 },
        ],
        evaluationCriteria: [
            { id: "latency", name: "Message Latency", description: "Time for message to appear", weight: 30, type: "automated", metric: "responseTimeP95" },
            { id: "capacity", name: "Concurrent Users", description: "Number of simultaneous users supported", weight: 25, type: "automated", metric: "throughput" },
            { id: "quality", name: "Code Quality", description: "Linting, types, and best practices", weight: 20, type: "code_quality" },
            { id: "uptime", name: "Reliability", description: "Uptime during load test", weight: 15, type: "automated", metric: "uptime" },
            { id: "ux", name: "User Experience", description: "Peer review of UI/UX", weight: 10, type: "peer_review" },
        ],
        testSuiteId: "chat-app-tests-v1",
        participantCount: 234,
    },
    {
        id: "url-shortener-2024",
        title: "URL Shortener Under Load",
        description:
            "Create a high-performance URL shortening service that can handle thousands of requests per second with minimal latency.",
        difficulty: "intermediate",
        cycle: { type: "sprint", duration: 168 },
        startDate: daysAgo(1),
        endDate: daysFromNow(6),
        status: "active",
        specification: {
            overview:
                "Build a URL shortener that prioritizes performance. Your service will be load-tested with thousands of concurrent requests.",
            technicalRequirements: [
                "Generate unique short codes for URLs",
                "Redirect short URLs to original destinations",
                "Track click statistics per URL",
                "Handle at least 1000 requests per second",
            ],
            constraints: [
                "Short codes must be 6-8 characters",
                "Must use an in-memory cache layer",
                "Response time must be under 50ms for redirects",
            ],
            exampleInputOutput: [
                { input: "POST /shorten { url: 'https://example.com/very/long/path' }", output: "{ shortUrl: 'https://short.ly/abc123' }" },
                { input: "GET /abc123", output: "302 Redirect to https://example.com/very/long/path" },
            ],
            resourceLimits: {
                maxMemoryMB: 256,
                maxCpuPercent: 25,
                maxStorageMB: 50,
                maxBandwidthMbps: 5,
                maxColdStartMs: 1000,
            },
        },
        requiredFeatures: [
            { id: "shorten", name: "URL Shortening", description: "Generate short codes for long URLs", testable: true, weight: 25 },
            { id: "redirect", name: "URL Redirection", description: "Redirect short URLs to originals", testable: true, weight: 25 },
            { id: "stats", name: "Click Tracking", description: "Count clicks per short URL", testable: true, weight: 20 },
            { id: "validation", name: "URL Validation", description: "Validate input URLs", testable: true, weight: 15 },
            { id: "expiry", name: "URL Expiration", description: "Optional expiration for short URLs", testable: true, weight: 15 },
        ],
        bonusObjectives: [
            { id: "custom", name: "Custom Short Codes", description: "Allow users to choose their short code", points: 50 },
            { id: "analytics", name: "Analytics Dashboard", description: "Visual click analytics", points: 75 },
            { id: "qr", name: "QR Code Generation", description: "Generate QR codes for short URLs", points: 40 },
        ],
        evaluationCriteria: [
            { id: "latency", name: "Response Latency", description: "P95 response time", weight: 35, type: "automated", metric: "responseTimeP95" },
            { id: "throughput", name: "Throughput", description: "Requests per second handled", weight: 30, type: "automated", metric: "throughput" },
            { id: "errors", name: "Error Rate", description: "Percentage of failed requests", weight: 20, type: "automated", metric: "errorRate" },
            { id: "quality", name: "Code Quality", description: "Clean, maintainable code", weight: 15, type: "code_quality" },
        ],
        testSuiteId: "url-shortener-tests-v1",
        participantCount: 456,
    },
    {
        id: "rate-limiter-2024",
        title: "API Rate Limiter",
        description:
            "Implement a distributed rate limiting solution that can protect APIs from abuse while maintaining high availability.",
        difficulty: "advanced",
        cycle: { type: "marathon", duration: 504 },
        startDate: daysFromNow(3),
        endDate: daysFromNow(24),
        status: "upcoming",
        specification: {
            overview:
                "Build a rate limiting middleware that can be used to protect any API endpoint. Must work in a distributed environment.",
            technicalRequirements: [
                "Support multiple rate limiting algorithms (token bucket, sliding window)",
                "Must work across multiple server instances",
                "Provide clear rate limit headers in responses",
                "Support different limits per API key/user",
            ],
            constraints: [
                "Must add less than 5ms latency to requests",
                "Must handle Redis connection failures gracefully",
                "Configuration must be hot-reloadable",
            ],
            resourceLimits: {
                maxMemoryMB: 128,
                maxCpuPercent: 15,
                maxStorageMB: 20,
                maxBandwidthMbps: 2,
                maxColdStartMs: 500,
            },
        },
        requiredFeatures: [
            { id: "basic", name: "Basic Rate Limiting", description: "Limit requests per time window", testable: true, weight: 20 },
            { id: "algorithms", name: "Multiple Algorithms", description: "Token bucket and sliding window", testable: true, weight: 25 },
            { id: "distributed", name: "Distributed State", description: "Work across multiple instances", testable: true, weight: 25 },
            { id: "headers", name: "Rate Limit Headers", description: "Return remaining/reset headers", testable: true, weight: 15 },
            { id: "config", name: "Per-User Limits", description: "Different limits per user", testable: true, weight: 15 },
        ],
        bonusObjectives: [
            { id: "burst", name: "Burst Handling", description: "Allow temporary burst over limit", points: 60 },
            { id: "analytics", name: "Usage Analytics", description: "Track and report usage patterns", points: 80 },
            { id: "dynamic", name: "Dynamic Limits", description: "Adjust limits based on load", points: 100 },
        ],
        evaluationCriteria: [
            { id: "accuracy", name: "Limiting Accuracy", description: "How precisely limits are enforced", weight: 30, type: "automated" },
            { id: "latency", name: "Added Latency", description: "Overhead per request", weight: 25, type: "automated", metric: "responseTimeP50" },
            { id: "distributed", name: "Distribution Test", description: "Consistency across instances", weight: 25, type: "automated" },
            { id: "quality", name: "Code Quality", description: "Architecture and maintainability", weight: 20, type: "code_quality" },
        ],
        testSuiteId: "rate-limiter-tests-v1",
        participantCount: 0,
    },
    {
        id: "portfolio-gen-2024",
        title: "Portfolio Site Generator",
        description:
            "Create a tool that generates beautiful, responsive portfolio websites from a simple configuration file or form input.",
        difficulty: "beginner",
        cycle: { type: "sprint", duration: 168 },
        startDate: daysFromNow(5),
        endDate: daysFromNow(12),
        status: "upcoming",
        specification: {
            overview:
                "Build a portfolio generator that takes user information and creates a polished, deployable website.",
            technicalRequirements: [
                "Accept JSON/YAML configuration for portfolio content",
                "Generate static HTML/CSS output",
                "Include at least 3 different themes",
                "Output must be fully responsive",
            ],
            constraints: [
                "No server-side rendering required at runtime",
                "Generated sites must score 90+ on Lighthouse",
                "Must work without JavaScript for basic content",
            ],
        },
        requiredFeatures: [
            { id: "config", name: "Config Parsing", description: "Parse portfolio configuration", testable: true, weight: 20 },
            { id: "generate", name: "HTML Generation", description: "Generate valid HTML output", testable: true, weight: 25 },
            { id: "themes", name: "Theme Support", description: "Multiple visual themes", testable: true, weight: 20 },
            { id: "responsive", name: "Responsive Design", description: "Works on all screen sizes", testable: true, weight: 20 },
            { id: "preview", name: "Live Preview", description: "Preview before export", testable: true, weight: 15 },
        ],
        bonusObjectives: [
            { id: "cms", name: "Visual Editor", description: "WYSIWYG editing interface", points: 100 },
            { id: "deploy", name: "One-Click Deploy", description: "Deploy to Vercel/Netlify", points: 75 },
            { id: "custom", name: "Custom Domains", description: "Support custom domain config", points: 50 },
        ],
        evaluationCriteria: [
            { id: "output", name: "Output Quality", description: "Valid, semantic HTML", weight: 30, type: "automated" },
            { id: "lighthouse", name: "Lighthouse Score", description: "Performance and accessibility", weight: 25, type: "automated" },
            { id: "ux", name: "Generator UX", description: "Ease of use", weight: 25, type: "peer_review" },
            { id: "quality", name: "Code Quality", description: "Generator code quality", weight: 20, type: "code_quality" },
        ],
        testSuiteId: "portfolio-tests-v1",
        participantCount: 0,
        skillTierRestriction: "bronze",
    },
];

// Get all challenges
export function getAllChallenges(): Challenge[] {
    return CHALLENGE_TEMPLATES;
}

// Get challenges by status
export function getChallengesByStatus(status: Challenge["status"]): Challenge[] {
    return CHALLENGE_TEMPLATES.filter((c) => c.status === status);
}

// Get challenge by ID
export function getChallengeById(id: string): Challenge | null {
    return CHALLENGE_TEMPLATES.find((c) => c.id === id) || null;
}

// Mock leaderboard data
export function getMockLeaderboard(challengeId: string): Leaderboard {
    const mockMetrics: PerformanceMetrics = {
        responseTimeP50: 15,
        responseTimeP95: 35,
        responseTimeP99: 75,
        errorRate: 0.1,
        uptime: 99.9,
        throughput: 1500,
        memoryUsage: 45,
        cpuUsage: 30,
    };

    const entries: LeaderboardEntry[] = [
        { rank: 1, userId: "user-1", displayName: "speedcoder", tier: "platinum", score: 98.5, submissionId: "sub-1", metrics: { ...mockMetrics, responseTimeP50: 12 }, trend: "stable" },
        { rank: 2, userId: "user-2", displayName: "byteMaster", tier: "gold", score: 97.2, submissionId: "sub-2", metrics: { ...mockMetrics, responseTimeP50: 15 }, trend: "up", previousRank: 4 },
        { rank: 3, userId: "user-3", displayName: "devNinja", tier: "gold", score: 96.8, submissionId: "sub-3", metrics: { ...mockMetrics, responseTimeP50: 18 }, trend: "down", previousRank: 2 },
        { rank: 4, userId: "user-4", displayName: "codesmith", tier: "silver", score: 95.1, submissionId: "sub-4", metrics: { ...mockMetrics, responseTimeP50: 22 }, trend: "stable" },
        { rank: 5, userId: "user-5", displayName: "freshDev", tier: "bronze", score: 94.3, submissionId: "sub-5", metrics: { ...mockMetrics, responseTimeP50: 25 }, trend: "new" },
    ];

    return {
        challengeId,
        type: "overall",
        entries,
        lastUpdated: new Date().toISOString(),
    };
}
