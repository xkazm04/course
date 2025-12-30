import { BookOpen, Layers, Target, Code, TestTube, Eye, Sparkles } from 'lucide-react'
import type { PhaseType, ContributionStatus, AIAssistanceType } from './types'

export const PHASE_ICONS: Record<PhaseType, React.ElementType> = {
  exploration: BookOpen,
  learning: Layers,
  planning: Target,
  implementation: Code,
  testing: TestTube,
  review: Eye,
  refinement: Sparkles,
}

export const STATUS_COLORS: Record<ContributionStatus, { bg: string; text: string }> = {
  exploring: {
    bg: 'bg-[var(--forge-info)]/10',
    text: 'text-[var(--forge-info)]',
  },
  in_progress: {
    bg: 'bg-[var(--ember)]/10',
    text: 'text-[var(--ember)]',
  },
  review_ready: {
    bg: 'bg-[var(--forge-warning)]/10',
    text: 'text-[var(--forge-warning)]',
  },
  changes_requested: {
    bg: 'bg-[var(--forge-warning)]/10',
    text: 'text-[var(--forge-warning)]',
  },
  approved: {
    bg: 'bg-[var(--forge-success)]/10',
    text: 'text-[var(--forge-success)]',
  },
  merged: {
    bg: 'bg-[var(--ember)]/10',
    text: 'text-[var(--ember)]',
  },
  abandoned: {
    bg: 'bg-[var(--forge-bg-elevated)]',
    text: 'text-[var(--forge-text-muted)]',
  },
  blocked: {
    bg: 'bg-[var(--forge-error)]/10',
    text: 'text-[var(--forge-error)]',
  },
}

export const AI_RESPONSES: Record<AIAssistanceType, string> = {
  code_explanation:
    'Let me explain this code for you. The implementation follows a common pattern where... [AI would provide detailed explanation based on actual code context]',
  approach_guidance:
    "Here's how I'd approach this task:\n\n1. First, understand the existing implementation\n2. Identify the specific changes needed\n3. Write tests first (TDD approach)\n4. Implement incrementally\n5. Review and refactor",
  code_review:
    "I've reviewed your code. Here are my observations:\n\n✓ Good: Clean structure and naming\n⚠ Consider: Adding error handling for edge cases\n📝 Suggestion: Extract this logic into a helper function",
  debugging_help:
    "Let's debug this together:\n\n1. Check the error message carefully\n2. Add logging to trace the flow\n3. Verify input data is correct\n4. Look for common issues like null/undefined",
  best_practices:
    "Here are some best practices for this task:\n\n• Follow the project's existing patterns\n• Write clear, descriptive commit messages\n• Add tests for your changes\n• Update documentation if needed",
}
