"use client";

/**
 * Chat Tree Renderer
 *
 * Renders a decision tree as a conversational chat interface.
 * This component is the "view" layer that renders decision trees
 * as chat messages - the chat interface becomes a renderer for
 * decision trees, not a special mode.
 */

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bot, User, Send, ArrowLeft, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { PrismaticCard, Button } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ChatMessage, DecisionOption } from "../lib/decisionTreeTypes";
import type { GoalFormState } from "@/app/shared/lib/learnerProfile";
import { usePathCalculator } from "../lib/usePathCalculator";

// ============================================================================
// Component Props
// ============================================================================

export interface ChatTreeRendererProps {
    /** Chat messages to render */
    messages: ChatMessage[];
    /** Whether the bot is typing */
    isTyping?: boolean;
    /** Whether the tree is complete */
    isComplete?: boolean;
    /** Current form state for result display */
    formState: GoalFormState;
    /** Callback when an option is selected */
    onSelectOption: (option: string) => void;
    /** Callback when text is submitted */
    onSubmitInput: (text: string) => void;
    /** Callback to go back */
    onBack?: () => void;
    /** Whether back navigation is available */
    canGoBack?: boolean;
    /** Custom class name */
    className?: string;
    /** Whether to show the path result card */
    showResultCard?: boolean;
}

// ============================================================================
// Message Components
// ============================================================================

interface BotMessageProps {
    content: string;
    options?: DecisionOption[];
    allowFreeInput?: boolean;
    onSelectOption: (option: string) => void;
    prefersReducedMotion: boolean | null;
}

const BotMessage = ({
    content,
    options,
    allowFreeInput,
    onSelectOption,
    prefersReducedMotion,
}: BotMessageProps) => (
    <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
        className="flex gap-3"
    >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ember-glow)] to-[var(--ember)] text-[var(--forge-text-primary)] flex items-center justify-center shrink-0">
            <Bot size={ICON_SIZES.sm} />
        </div>
        <div className="max-w-[80%]">
            <div className="p-4 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-2xl rounded-tl-sm">
                <p className="text-sm text-[var(--forge-text-secondary)]">{content}</p>
            </div>
            {options && options.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {options.map((option, i) => (
                        <button
                            key={option.label}
                            onClick={() => onSelectOption(option.label)}
                            className={cn(
                                "px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-colors",
                                "bg-[var(--ember)]/10 hover:bg-[var(--ember)]/20",
                                "text-[var(--ember)]",
                                option.isRecommended && "ring-2 ring-[var(--ember)] ring-offset-2 ring-offset-[var(--forge-bg-anvil)]"
                            )}
                            data-testid={option.testId ?? `chat-option-${i}`}
                        >
                            {option.isRecommended && (
                                <span className="mr-1">⭐</span>
                            )}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </motion.div>
);

interface UserMessageProps {
    content: string;
    prefersReducedMotion: boolean | null;
}

const UserMessage = ({ content, prefersReducedMotion }: UserMessageProps) => (
    <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
        className="flex gap-3 flex-row-reverse"
    >
        <div className="w-8 h-8 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] flex items-center justify-center shrink-0">
            <User size={ICON_SIZES.sm} />
        </div>
        <div className="max-w-[80%] text-right">
            <div className="p-4 bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)] rounded-2xl rounded-tr-sm">
                <p className="text-sm">{content}</p>
            </div>
        </div>
    </motion.div>
);

// ============================================================================
// Typing Indicator
// ============================================================================

interface TypingIndicatorProps {
    prefersReducedMotion: boolean | null;
}

const TypingIndicator = ({ prefersReducedMotion }: TypingIndicatorProps) => (
    <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
        className="flex gap-3"
    >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ember-glow)] to-[var(--ember)] text-[var(--forge-text-primary)] flex items-center justify-center">
            <Bot size={ICON_SIZES.sm} />
        </div>
        <div className="p-4 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-2xl rounded-tl-sm">
            <div className="flex gap-1">
                <span
                    className={cn(
                        "w-2 h-2 bg-[var(--forge-text-muted)] rounded-full",
                        !prefersReducedMotion && "animate-bounce"
                    )}
                    style={{ animationDelay: "0ms" }}
                />
                <span
                    className={cn(
                        "w-2 h-2 bg-[var(--forge-text-muted)] rounded-full",
                        !prefersReducedMotion && "animate-bounce"
                    )}
                    style={{ animationDelay: "150ms" }}
                />
                <span
                    className={cn(
                        "w-2 h-2 bg-[var(--forge-text-muted)] rounded-full",
                        !prefersReducedMotion && "animate-bounce"
                    )}
                    style={{ animationDelay: "300ms" }}
                />
            </div>
        </div>
    </motion.div>
);

// ============================================================================
// Result Card
// ============================================================================

interface PathResultCardProps {
    formState: GoalFormState;
    prefersReducedMotion: boolean | null;
}

const PathResultCard = ({ formState, prefersReducedMotion }: PathResultCardProps) => {
    const { estimatedWeeks, lessons, projects, totalHours } = usePathCalculator(formState);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cardRef.current) {
            const timeout = setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "end",
                });
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={cardRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="mt-4 p-6 bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] rounded-2xl text-[var(--forge-text-primary)]"
            data-testid="chat-generated-path"
        >
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={ICON_SIZES.md} />
                <h4 className="font-bold">Your Personalized Path</h4>
            </div>

            {/* Summary showing goal from form state */}
            <div className="p-3 bg-white/10 rounded-xl mb-4">
                <div className="text-xs text-white/70 mb-1">Goal</div>
                <div className="font-medium">{formState.goal || "Your Learning Path"}</div>
            </div>

            {/* Metrics calculated from form state */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <div className="text-xl font-black" data-testid="chat-result-weeks">
                        {estimatedWeeks}
                    </div>
                    <div className="text-xs text-white/70">Weeks</div>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <div className="text-xl font-black" data-testid="chat-result-lessons">
                        {lessons}
                    </div>
                    <div className="text-xs text-white/70">Lessons</div>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <div className="text-xl font-black" data-testid="chat-result-projects">
                        {projects}
                    </div>
                    <div className="text-xs text-white/70">Projects</div>
                </div>
            </div>

            {/* Curriculum phases */}
            <div className="space-y-3">
                {[
                    { title: "Foundations", duration: `${Math.ceil(estimatedWeeks * 0.18)} weeks` },
                    { title: "Core Skills", duration: `${Math.ceil(estimatedWeeks * 0.36)} weeks` },
                    { title: "Advanced Concepts", duration: `${Math.ceil(estimatedWeeks * 0.27)} weeks` },
                    { title: "Projects & Portfolio", duration: `${Math.ceil(estimatedWeeks * 0.19)} weeks` },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-white/10 rounded-xl"
                    >
                        <CheckCircle2 size={ICON_SIZES.md} />
                        <span className="flex-1 font-medium">{item.title}</span>
                        <span className="text-sm text-white/70">{item.duration}</span>
                    </div>
                ))}
            </div>

            <Button
                size="full"
                variant="secondary"
                className="mt-4 bg-[var(--forge-bg-daylight)] text-[var(--ember)] hover:bg-[var(--forge-bg-daylight)]/90 shadow-none"
                data-testid="chat-start-journey-btn"
            >
                Start My Journey <ArrowRight size={ICON_SIZES.md} />
            </Button>
        </motion.div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChatTreeRenderer = ({
    messages,
    isTyping = false,
    isComplete = false,
    formState,
    onSelectOption,
    onSubmitInput,
    onBack,
    canGoBack = false,
    className,
    showResultCard = true,
}: ChatTreeRendererProps) => {
    const prefersReducedMotion = useReducedMotion();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = React.useState("");

    // Auto-scroll to bottom when new messages appear
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "end",
            });
        }
    }, [messages, isTyping, prefersReducedMotion]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;
        onSubmitInput(inputValue.trim());
        setInputValue("");
    };

    // Find the current bot message with options (last one)
    const currentMessage = messages[messages.length - 1];
    const showInput = currentMessage?.type === "bot" && currentMessage?.allowFreeInput;

    return (
        <div className={cn("max-w-3xl mx-auto", className)}>
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : undefined}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--ember-glow)]/10 text-[var(--ember-glow)] font-bold tracking-wide text-xs uppercase mb-4"
                >
                    <Bot size={ICON_SIZES.sm} />
                    AI-Powered Path Generation
                </motion.div>
                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
                    Chat with Your Learning AI
                </h2>
                <p className="text-[var(--text-secondary)]">
                    Have a conversation to discover your perfect learning path
                </p>
            </div>

            <PrismaticCard glowColor="purple">
                <div className="flex flex-col h-[600px]">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Back button */}
                        {canGoBack && onBack && (
                            <button
                                onClick={onBack}
                                className="text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] flex items-center gap-1 mb-2"
                                data-testid="chat-back-btn"
                            >
                                <ArrowLeft size={ICON_SIZES.sm} />
                                Go back
                            </button>
                        )}

                        <AnimatePresence>
                            {messages.map((message) =>
                                message.type === "bot" ? (
                                    <BotMessage
                                        key={message.id}
                                        content={message.content}
                                        options={message.options}
                                        allowFreeInput={message.allowFreeInput}
                                        onSelectOption={onSelectOption}
                                        prefersReducedMotion={prefersReducedMotion}
                                    />
                                ) : (
                                    <UserMessage
                                        key={message.id}
                                        content={message.content}
                                        prefersReducedMotion={prefersReducedMotion}
                                    />
                                )
                            )}
                        </AnimatePresence>

                        {isTyping && (
                            <TypingIndicator prefersReducedMotion={prefersReducedMotion} />
                        )}

                        {/* Result card when complete */}
                        {isComplete && showResultCard && (
                            <PathResultCard
                                formState={formState}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} aria-hidden="true" />
                    </div>

                    {/* Input Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="p-4 border-t border-[var(--forge-border-subtle)]"
                    >
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={
                                    currentMessage?.inputPlaceholder ?? "Type your message..."
                                }
                                className="flex-1 p-4 bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)] focus:border-[var(--ember)] focus:ring-2 focus:ring-[var(--ember)]/20 outline-none transition-all"
                                data-testid="chat-input"
                            />
                            <Button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                size="md"
                                variant="secondary"
                                className="px-6"
                                data-testid="chat-send-btn"
                            >
                                <Send size={ICON_SIZES.md} />
                            </Button>
                        </div>
                    </form>
                </div>
            </PrismaticCard>
        </div>
    );
};

export default ChatTreeRenderer;
