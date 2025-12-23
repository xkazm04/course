"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
    rotation: number;
    size: number;
}

interface ConfettiProps {
    isActive: boolean;
    duration?: number; // milliseconds
    pieceCount?: number;
}

const COLORS = [
    "#f97316", // orange-500
    "#eab308", // yellow-500
    "#22c55e", // green-500
    "#06b6d4", // cyan-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#ef4444", // red-500
    "#3b82f6", // blue-500
];

export const Confetti = ({
    isActive,
    duration = 3000,
    pieceCount = 50,
}: ConfettiProps) => {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (isActive && !isShowing) {
            setIsShowing(true);

            const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 2,
                rotation: Math.random() * 720 - 360,
                size: 8 + Math.random() * 8,
            }));

            setPieces(newPieces);

            const timeout = setTimeout(() => {
                setIsShowing(false);
                setPieces([]);
            }, duration);

            return () => clearTimeout(timeout);
        }
    }, [isActive, isShowing, pieceCount, duration]);

    return (
        <AnimatePresence>
            {isShowing && (
                <div
                    className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]"
                    data-testid="confetti-container"
                >
                    {pieces.map((piece) => (
                        <motion.div
                            key={piece.id}
                            initial={{
                                opacity: 1,
                                x: `${piece.x}vw`,
                                y: -20,
                                rotate: 0,
                                scale: 1,
                            }}
                            animate={{
                                opacity: [1, 1, 0],
                                y: "110vh",
                                rotate: piece.rotation,
                                scale: [1, 1.2, 0.8],
                            }}
                            transition={{
                                duration: piece.duration,
                                delay: piece.delay,
                                ease: "easeOut",
                            }}
                            style={{
                                position: "absolute",
                                width: piece.size,
                                height: piece.size,
                                backgroundColor: piece.color,
                                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
};
