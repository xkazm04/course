'use client';

import { motion } from 'framer-motion';
import { ExperienceLevel } from '../../lib/oracleQuestions';

interface StepGeneratingProps {
  experience: ExperienceLevel | null;
}

const loadingMessages = [
  'Analyzing your profile...',
  'Consulting current industry trends...',
  'Mapping optimal learning sequences...',
  'Crafting personalized paths...',
  'Almost there...',
];

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
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Animated Oracle icon */}
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-lg shadow-[var(--ember)]/30">
          <motion.span
            className="text-4xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔮
          </motion.span>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-[var(--ember)]"
            style={{
              top: '50%',
              left: '50%',
              marginTop: '-6px',
              marginLeft: '-6px',
            }}
            animate={{
              x: [0, 50, 0, -50, 0],
              y: [-50, 0, 50, 0, -50],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Main message */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">
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

      {/* Loading steps */}
      <div className="w-full max-w-xs space-y-2">
        {loadingMessages.map((message, index) => (
          <motion.div
            key={message}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 1.5 }}
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
