'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExperienceLevel } from '../../lib/oracleQuestions';

interface StepGeneratingProps {
  experience: ExperienceLevel | null;
}

const loadingMessages = [
  'Analyzing your learning profile...',
  'Consulting current industry trends...',
  'Mapping optimal learning sequences...',
  'Evaluating skill prerequisites...',
  'Crafting personalized curriculum...',
  'Optimizing chapter structure...',
  'Almost ready...',
];

// Progress bar fills over 60 seconds for realistic AI generation feel
const PROGRESS_DURATION_SECONDS = 60;

export function StepGenerating({ experience }: StepGeneratingProps) {
  const getExperienceContext = () => {
    switch (experience) {
      case 'beginner':
        return 'Building your foundation path...';
      case 'intermediate':
        return 'Designing your breakthrough path...';
      case 'advanced':
        return 'Optimizing your expertise path...';
      default:
        return 'Creating your learning path...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8">
      {/* Bonk animation */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glowing background effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--ember)]/30 to-[var(--ember-glow)]/30 blur-xl scale-150" />

        {/* Main container with ember border */}
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-[var(--ember)]/50 shadow-lg shadow-[var(--ember)]/20">
          <Image
            src="/anim/bonk.gif"
            alt="Forging your path..."
            width={128}
            height={128}
            className="w-full h-full object-cover"
            unoptimized
            priority
          />
        </div>

        {/* Animated ring around the gif */}
        <motion.div
          className="absolute -inset-2 rounded-2xl border-2 border-[var(--ember)]/30"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Main message */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[var(--oracle-text-heading)]">
          {getExperienceContext()}
        </h3>
        <motion.p
          className="text-sm text-[var(--forge-text-secondary)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          The Oracle is consulting the knowledge graph...
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 rounded-full bg-[var(--forge-bg-elevated)] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: PROGRESS_DURATION_SECONDS,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Loading steps - appear at intervals throughout the 60s */}
      <div className="w-full max-w-xs space-y-2">
        {loadingMessages.map((message, index) => (
          <motion.div
            key={message}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * (PROGRESS_DURATION_SECONDS / loadingMessages.length) }}
            className="flex items-center gap-3"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-[var(--ember)]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
            />
            <span className="text-sm text-[var(--forge-text-secondary)]">{message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
