"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ChatMessage, ClientPersona } from "../lib/types";

interface ChatInterfaceProps {
    messages: ChatMessage[];
    persona: ClientPersona;
    onSendMessage: (content: string) => void;
    disabled?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    persona,
    onSendMessage,
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || disabled) return;

        onSendMessage(inputValue.trim());
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <EmptyChat persona={persona} />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {messages.map(message => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                persona={persona}
                            />
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-[var(--border-subtle)]"
            >
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${persona.name}...`}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "flex-1 px-4 py-3 rounded-xl resize-none",
                            "bg-[var(--surface-overlay)] border border-[var(--border-default)]",
                            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                            "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    />
                    <motion.button
                        type="submit"
                        disabled={!inputValue.trim() || disabled}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "px-4 py-3 rounded-xl",
                            "bg-[var(--accent-primary)] text-white",
                            "hover:bg-[var(--accent-primary-hover)] transition-colors",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <Send size={ICON_SIZES.md} />
                    </motion.button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </form>
        </div>
    );
};

// Empty chat state
interface EmptyChatProps {
    persona: ClientPersona;
}

const EmptyChat: React.FC<EmptyChatProps> = ({ persona }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-6xl mb-4">{persona.avatar}</div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Start your conversation with {persona.name}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md">
                {persona.name} is a {persona.role} at a {persona.companySize} {persona.industry.name} company.
                Ask questions, discuss requirements, and build their project!
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <SuggestionChip text="Tell me about your project" />
                <SuggestionChip text="What's the timeline?" />
                <SuggestionChip text="What's most important to you?" />
            </div>
        </div>
    );
};

// Suggestion chip
interface SuggestionChipProps {
    text: string;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ text }) => {
    return (
        <span className="px-3 py-1.5 rounded-full text-xs bg-[var(--surface-overlay)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            "{text}"
        </span>
    );
};

// Message bubble
interface MessageBubbleProps {
    message: ChatMessage;
    persona: ClientPersona;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, persona }) => {
    const isClient = message.sender === "client";
    const isSystem = message.sender === "system";

    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
            >
                <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                    {message.content}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "flex gap-3",
                isClient ? "justify-start" : "justify-end"
            )}
        >
            {isClient && (
                <div className="flex-shrink-0 text-2xl">{persona.avatar}</div>
            )}

            <div
                className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3",
                    isClient
                        ? "bg-[var(--surface-overlay)] border border-[var(--border-subtle)] rounded-tl-md"
                        : "bg-[var(--accent-primary)] text-white rounded-tr-md"
                )}
            >
                {message.isTyping ? (
                    <TypingIndicator />
                ) : (
                    <>
                        <p className={cn(
                            "text-sm leading-relaxed whitespace-pre-wrap",
                            isClient ? "text-[var(--text-primary)]" : "text-white"
                        )}>
                            {message.content}
                        </p>
                        <span className={cn(
                            "text-xs mt-1 block",
                            isClient ? "text-[var(--text-muted)]" : "text-white/70"
                        )}>
                            {formatTime(new Date(message.timestamp))}
                        </span>
                    </>
                )}
            </div>

            {!isClient && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm font-medium">
                    You
                </div>
            )}
        </motion.div>
    );
};

// Typing indicator
const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[var(--text-muted)]"
                    animate={{
                        y: [0, -4, 0],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                    }}
                />
            ))}
        </div>
    );
};

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
