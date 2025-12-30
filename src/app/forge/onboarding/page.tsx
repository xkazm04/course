"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Github,
    ArrowRight,
    ArrowLeft,
    Check,
    Code,
    BookOpen,
    Briefcase,
    Rocket,
    Clock,
    Target,
    Sparkles,
    ChevronRight,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../layout";
import { mockProjects } from "../lib/mockData";

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingState {
    step: number;
    skillLevel: string | null;
    interests: string[];
    goals: string[];
    weeklyHours: number | null;
    githubConnected: boolean;
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                Welcome to OpenForge
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
                Let's set up your profile to match you with the perfect projects and challenges.
                This will take about 2 minutes.
            </p>
            <button
                onClick={onNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
                Let's Get Started
                <ArrowRight size={18} />
            </button>
        </div>
    );
}

function SkillLevelStep({
    value,
    onChange,
    onNext,
    onBack,
}: {
    value: string | null;
    onChange: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const levels = [
        {
            id: "beginner",
            title: "Beginner",
            description: "New to programming or just starting with web development",
            icon: BookOpen,
            examples: "Learning basics, built a few tutorials",
        },
        {
            id: "intermediate",
            title: "Intermediate",
            description: "Comfortable with code, built some projects",
            icon: Code,
            examples: "Personal projects, some professional experience",
        },
        {
            id: "advanced",
            title: "Advanced",
            description: "Professional developer looking to expand skills",
            icon: Briefcase,
            examples: "2+ years experience, worked on production apps",
        },
        {
            id: "expert",
            title: "Expert",
            description: "Senior developer seeking new challenges",
            icon: Rocket,
            examples: "5+ years, led teams, architected systems",
        },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    What's your experience level?
                </h2>
                <p className="text-[var(--text-secondary)]">
                    This helps us recommend appropriate challenges
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {levels.map((level) => {
                    const Icon = level.icon;
                    const isSelected = value === level.id;
                    return (
                        <button
                            key={level.id}
                            onClick={() => onChange(level.id)}
                            className={cn(
                                "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                                isSelected
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                    isSelected
                                        ? "bg-[var(--accent-primary)] text-white"
                                        : "bg-[var(--surface-overlay)] text-[var(--text-muted)]"
                                )}
                            >
                                <Icon size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-[var(--text-primary)]">
                                        {level.title}
                                    </h3>
                                    {isSelected && (
                                        <Check size={16} className="text-[var(--accent-primary)]" />
                                    )}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mb-1">
                                    {level.description}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {level.examples}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!value}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                        value
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90"
                            : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

function InterestsStep({
    value,
    onChange,
    onNext,
    onBack,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const interests = [
        { id: "frontend", label: "Frontend Development", emoji: "🎨" },
        { id: "backend", label: "Backend Development", emoji: "⚙️" },
        { id: "fullstack", label: "Full-Stack", emoji: "🔗" },
        { id: "mobile", label: "Mobile Apps", emoji: "📱" },
        { id: "devops", label: "DevOps & Cloud", emoji: "☁️" },
        { id: "ai", label: "AI & Machine Learning", emoji: "🤖" },
        { id: "security", label: "Security", emoji: "🔒" },
        { id: "testing", label: "Testing & QA", emoji: "🧪" },
        { id: "databases", label: "Databases", emoji: "🗄️" },
        { id: "performance", label: "Performance", emoji: "⚡" },
    ];

    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    What interests you?
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Select all that apply - we'll show you relevant projects
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                {interests.map((interest) => {
                    const isSelected = value.includes(interest.id);
                    return (
                        <button
                            key={interest.id}
                            onClick={() => toggle(interest.id)}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                                isSelected
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <span className="text-2xl">{interest.emoji}</span>
                            <span
                                className={cn(
                                    "font-medium",
                                    isSelected
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-secondary)]"
                                )}
                            >
                                {interest.label}
                            </span>
                            {isSelected && (
                                <Check
                                    size={16}
                                    className="text-[var(--accent-primary)] ml-auto"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={value.length === 0}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                        value.length > 0
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90"
                            : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

function GoalsStep({
    value,
    onChange,
    onNext,
    onBack,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const goals = [
        { id: "job", label: "Get a developer job", description: "Build portfolio for employment" },
        { id: "freelance", label: "Start freelancing", description: "Learn to build client projects" },
        { id: "startup", label: "Build my own product", description: "Gain full-stack skills for a startup" },
        { id: "upskill", label: "Level up at work", description: "Improve skills for current role" },
        { id: "opensource", label: "Contribute to OSS", description: "Give back to the community" },
        { id: "hobby", label: "Just for fun", description: "Learning for personal enjoyment" },
    ];

    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else if (value.length < 3) {
            onChange([...value, id]);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    What are your goals?
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Pick up to 3 - we'll tailor your learning path
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {goals.map((goal) => {
                    const isSelected = value.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            onClick={() => toggle(goal.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                isSelected
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                    isSelected
                                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                                        : "border-[var(--border-strong)]"
                                )}
                            >
                                {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <div>
                                <h3 className="font-medium text-[var(--text-primary)]">
                                    {goal.label}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {goal.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={value.length === 0}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                        value.length > 0
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90"
                            : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

function TimeCommitmentStep({
    value,
    onChange,
    onNext,
    onBack,
}: {
    value: number | null;
    onChange: (v: number) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const options = [
        { hours: 2, label: "2-3 hours", description: "Casual learner", pace: "1-2 challenges/week" },
        { hours: 5, label: "5-7 hours", description: "Part-time", pace: "3-4 challenges/week" },
        { hours: 10, label: "10-15 hours", description: "Dedicated", pace: "5-7 challenges/week" },
        { hours: 20, label: "20+ hours", description: "Intensive", pace: "10+ challenges/week" },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    How much time can you commit?
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Weekly hours - this helps set realistic goals
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {options.map((option) => {
                    const isSelected = value === option.hours;
                    return (
                        <button
                            key={option.hours}
                            onClick={() => onChange(option.hours)}
                            className={cn(
                                "flex flex-col items-center p-6 rounded-xl border text-center transition-all",
                                isSelected
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <Clock
                                size={32}
                                className={cn(
                                    "mb-3",
                                    isSelected
                                        ? "text-[var(--accent-primary)]"
                                        : "text-[var(--text-muted)]"
                                )}
                            />
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                                {option.label}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                {option.description}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{option.pace}</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!value}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                        value
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90"
                            : "bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

function GitHubConnectStep({
    connected,
    onConnect,
    onSkip,
    onBack,
}: {
    connected: boolean;
    onConnect: () => void;
    onSkip: () => void;
    onBack: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Connect Your GitHub
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Required for submitting PRs - you can also connect later
                </p>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 mb-8">
                {connected ? (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--forge-success)]/20 flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-[var(--forge-success)]" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                            GitHub Connected!
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            You're ready to start contributing to projects
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-[var(--forge-bg-void)] flex items-center justify-center flex-shrink-0">
                                <Github size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                                    Why connect GitHub?
                                </h3>
                                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-[var(--forge-success)]" />
                                        Fork projects directly to your account
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-[var(--forge-success)]" />
                                        Submit pull requests seamlessly
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-[var(--forge-success)]" />
                                        Build a verified contribution history
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={onConnect}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--forge-bg-void)] text-white font-medium hover:bg-[var(--forge-bg-anvil)] transition-colors"
                        >
                            <Github size={20} />
                            Connect GitHub Account
                        </button>
                    </>
                )}
            </div>

            {!connected && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-8">
                    <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-[var(--text-primary)]">
                            You can explore projects without GitHub, but you'll need to connect
                            before submitting any contributions.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div className="flex items-center gap-3">
                    {!connected && (
                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            Skip for now
                        </button>
                    )}
                    <button
                        onClick={onSkip}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        {connected ? "Continue" : "Continue Without GitHub"}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RecommendationsStep({ state, onFinish }: { state: OnboardingState; onFinish: () => void }) {
    // Recommend based on interests and skill level
    const recommendedProjects = mockProjects.slice(0, 3);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--forge-success)] to-[var(--forge-success)] flex items-center justify-center mx-auto mb-4">
                    <Target size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Your Personalized Path
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Based on your profile, here are recommended projects to get started
                </p>
            </div>

            <div className="space-y-4 mb-8">
                {recommendedProjects.map((project, index) => (
                    <div
                        key={project.id}
                        className="flex items-center gap-4 p-4 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)]"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-orange-500">
                                {index + 1}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--text-primary)]">
                                {project.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {project.tagline}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded bg-[var(--forge-success)]/10 text-[var(--forge-success)]">
                                    {project.openChallenges} beginner challenges
                                </span>
                                <span className="text-xs text-[var(--text-muted)]">
                                    {project.language}
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-[var(--text-muted)]" />
                    </div>
                ))}
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 mb-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                    Your Profile Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-[var(--text-muted)]">Experience Level:</span>
                        <span className="ml-2 text-[var(--text-primary)] capitalize">
                            {state.skillLevel || "Not set"}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--text-muted)]">Weekly Commitment:</span>
                        <span className="ml-2 text-[var(--text-primary)]">
                            {state.weeklyHours ? `${state.weeklyHours} hours` : "Not set"}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--text-muted)]">GitHub:</span>
                        <span
                            className={cn(
                                "ml-2",
                                state.githubConnected ? "text-[var(--forge-success)]" : "text-[var(--gold)]"
                            )}
                        >
                            {state.githubConnected ? "Connected" : "Not connected"}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--text-muted)]">Interests:</span>
                        <span className="ml-2 text-[var(--text-primary)]">
                            {state.interests.length} selected
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={onFinish}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-lg hover:opacity-90 transition-opacity"
                >
                    Start Learning
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN ONBOARDING PAGE
// ============================================================================

export default function OnboardingPage() {
    const router = useRouter();
    const { setIsNewUser, setUser } = useForge();
    const [state, setState] = useState<OnboardingState>({
        step: 0,
        skillLevel: null,
        interests: [],
        goals: [],
        weeklyHours: null,
        githubConnected: false,
    });

    const totalSteps = 7;

    const handleFinish = () => {
        // In real app, would save to DB and update user
        setIsNewUser(false);
        router.push("/forge/dashboard");
    };

    const renderStep = () => {
        switch (state.step) {
            case 0:
                return (
                    <WelcomeStep
                        onNext={() => setState((s) => ({ ...s, step: 1 }))}
                    />
                );
            case 1:
                return (
                    <SkillLevelStep
                        value={state.skillLevel}
                        onChange={(v) => setState((s) => ({ ...s, skillLevel: v }))}
                        onNext={() => setState((s) => ({ ...s, step: 2 }))}
                        onBack={() => setState((s) => ({ ...s, step: 0 }))}
                    />
                );
            case 2:
                return (
                    <InterestsStep
                        value={state.interests}
                        onChange={(v) => setState((s) => ({ ...s, interests: v }))}
                        onNext={() => setState((s) => ({ ...s, step: 3 }))}
                        onBack={() => setState((s) => ({ ...s, step: 1 }))}
                    />
                );
            case 3:
                return (
                    <GoalsStep
                        value={state.goals}
                        onChange={(v) => setState((s) => ({ ...s, goals: v }))}
                        onNext={() => setState((s) => ({ ...s, step: 4 }))}
                        onBack={() => setState((s) => ({ ...s, step: 2 }))}
                    />
                );
            case 4:
                return (
                    <TimeCommitmentStep
                        value={state.weeklyHours}
                        onChange={(v) => setState((s) => ({ ...s, weeklyHours: v }))}
                        onNext={() => setState((s) => ({ ...s, step: 5 }))}
                        onBack={() => setState((s) => ({ ...s, step: 3 }))}
                    />
                );
            case 5:
                return (
                    <GitHubConnectStep
                        connected={state.githubConnected}
                        onConnect={() => setState((s) => ({ ...s, githubConnected: true }))}
                        onSkip={() => setState((s) => ({ ...s, step: 6 }))}
                        onBack={() => setState((s) => ({ ...s, step: 4 }))}
                    />
                );
            case 6:
                return <RecommendationsStep state={state} onFinish={handleFinish} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--surface-base)]">
            {/* Progress bar */}
            {state.step > 0 && state.step < 6 && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--surface-overlay)] z-50">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${(state.step / (totalSteps - 1)) * 100}%` }}
                    />
                </div>
            )}

            {/* Skip link */}
            {state.step > 0 && state.step < 6 && (
                <div className="fixed top-4 right-4 z-50">
                    <Link
                        href="/forge"
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Skip onboarding
                    </Link>
                </div>
            )}

            {/* Content */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl py-12">{renderStep()}</div>
            </div>
        </div>
    );
}
