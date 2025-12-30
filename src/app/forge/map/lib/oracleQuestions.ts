/**
 * Oracle Questions Configuration
 * Psychology-informed question flow with experience-based branching
 */

// ============================================================================
// TYPES
// ============================================================================

export type DomainId = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'data' | 'devops';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'card-select' | 'single-select' | 'multi-select' | 'textarea';

export interface QuestionOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  examples?: string;
  note?: string;
}

export interface Question {
  id: string;
  question: string;
  subtitle?: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
  optional?: boolean;
  maxLength?: number;
  maxSelections?: number;
}

export interface DomainConfig {
  id: DomainId;
  icon: string;
  label: string;
  description: string;
  examples: string;
  experienceOptions: QuestionOption[];
}

export interface BranchQuestions {
  beginner: Question[];
  intermediate: Question[];
  advanced: Question[];
}

// ============================================================================
// STEP 1: DOMAIN SELECTION
// ============================================================================

export const DOMAIN_QUESTION: Question = {
  id: 'domain',
  question: "What area of software development excites you most?",
  subtitle: "Don't worry - you can always explore other areas later",
  type: 'card-select',
  options: [
    {
      id: 'frontend',
      icon: '🎨',
      label: 'Frontend',
      description: 'Build what users see and interact with',
      examples: 'Websites, web apps, user interfaces'
    },
    {
      id: 'backend',
      icon: '⚙️',
      label: 'Backend',
      description: 'Power the logic behind applications',
      examples: 'APIs, databases, server infrastructure'
    },
    {
      id: 'fullstack',
      icon: '🔄',
      label: 'Fullstack',
      description: 'Master both sides of the equation',
      examples: 'Complete web applications end-to-end'
    },
    {
      id: 'mobile',
      icon: '📱',
      label: 'Mobile',
      description: 'Create apps people carry in their pockets',
      examples: 'iOS, Android, cross-platform apps'
    },
    {
      id: 'data',
      icon: '📊',
      label: 'Data & AI',
      description: 'Turn data into insights and intelligence',
      examples: 'Analytics, machine learning, AI applications'
    },
    {
      id: 'devops',
      icon: '🚀',
      label: 'DevOps & Cloud',
      description: 'Keep systems running and scaling',
      examples: 'CI/CD, cloud infrastructure, automation'
    }
  ]
};

// ============================================================================
// STEP 2: EXPERIENCE ASSESSMENT (Domain-specific scenarios)
// ============================================================================

export const EXPERIENCE_QUESTIONS: Record<DomainId, Question> = {
  frontend: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: "I'm curious about web development",
        note: "Haven't built a website yet, or only followed tutorials"
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can build websites and simple apps',
        note: 'Comfortable with HTML/CSS/JS, maybe used React or Vue'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Developer',
        description: 'I build production applications',
        note: 'Shipped real projects, understand architecture decisions'
      }
    ]
  },
  backend: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: 'I want to learn how servers work',
        note: 'Never written backend code or it\'s all new to me'
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can build APIs and work with databases',
        note: 'Created CRUD apps, understand HTTP and basic SQL'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Developer',
        description: 'I design and scale backend systems',
        note: 'Production experience, understand distributed systems'
      }
    ]
  },
  fullstack: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: 'I want to build complete applications',
        note: 'New to development or only know one side'
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can work on both frontend and backend',
        note: 'Built full apps, comfortable with databases and UI'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Developer',
        description: 'I architect and ship complete systems',
        note: 'End-to-end ownership, deployment experience'
      }
    ]
  },
  mobile: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: 'I want to build mobile apps',
        note: 'Never built an app or just exploring'
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can build and publish simple apps',
        note: 'Familiar with React Native, Flutter, or native dev'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Developer',
        description: 'I build production mobile applications',
        note: 'Published apps, understand platform specifics'
      }
    ]
  },
  data: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: 'I want to work with data and AI',
        note: 'New to data science or programming'
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can analyze data and build models',
        note: 'Familiar with Python, pandas, basic ML'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Practitioner',
        description: 'I deploy ML models to production',
        note: 'End-to-end ML pipelines, advanced techniques'
      }
    ]
  },
  devops: {
    id: 'experience',
    question: 'Which best describes where you are right now?',
    subtitle: "Be honest - there's a perfect path for every starting point",
    type: 'single-select',
    options: [
      {
        id: 'beginner',
        icon: '🌱',
        label: 'Just Starting',
        description: 'I want to learn cloud and infrastructure',
        note: 'New to DevOps, maybe some basic Linux'
      },
      {
        id: 'intermediate',
        icon: '🌿',
        label: 'Building Foundation',
        description: 'I can deploy and manage applications',
        note: 'Familiar with Docker, CI/CD, basic cloud'
      },
      {
        id: 'advanced',
        icon: '🌳',
        label: 'Experienced Engineer',
        description: 'I architect cloud infrastructure',
        note: 'Production systems, IaC, security practices'
      }
    ]
  }
};

// ============================================================================
// STEP 3A: BEGINNER BRANCH QUESTIONS
// ============================================================================

export const BEGINNER_QUESTIONS: Question[] = [
  {
    id: 'beginner_motivation',
    question: "What's drawing you to learn this?",
    subtitle: "Understanding your 'why' helps us find the right path",
    type: 'single-select',
    options: [
      {
        id: 'career_change',
        icon: '🔄',
        label: 'Career Change',
        description: 'I want to switch into tech from another field'
      },
      {
        id: 'career_start',
        icon: '🎓',
        label: 'Starting My Career',
        description: "I'm a student or recent grad entering the field"
      },
      {
        id: 'side_projects',
        icon: '💡',
        label: 'Build My Ideas',
        description: 'I have projects I want to bring to life'
      },
      {
        id: 'curiosity',
        icon: '🔍',
        label: 'Pure Curiosity',
        description: 'I just want to understand how things work'
      },
      {
        id: 'job_requirement',
        icon: '💼',
        label: 'Job Requirement',
        description: 'I need these skills for my current or next role'
      }
    ]
  },
  {
    id: 'beginner_learning_style',
    question: 'How do you learn best?',
    subtitle: "We'll tailor the path to match your style",
    type: 'single-select',
    options: [
      {
        id: 'structured',
        icon: '📚',
        label: 'Structured & Sequential',
        description: "I like clear steps, knowing exactly what's next"
      },
      {
        id: 'project_based',
        icon: '🛠️',
        label: 'Project-Based',
        description: 'I learn by building real things, even if messy'
      },
      {
        id: 'theory_first',
        icon: '🧠',
        label: 'Theory First',
        description: "I want to understand the 'why' before the 'how'"
      },
      {
        id: 'mixed',
        icon: '🔀',
        label: 'Mix It Up',
        description: 'I like variety - some theory, some practice'
      }
    ]
  },
  {
    id: 'beginner_concerns',
    question: 'What concerns you most about this journey?',
    subtitle: "Let's address what's on your mind",
    type: 'multi-select',
    maxSelections: 2,
    options: [
      {
        id: 'time',
        icon: '⏰',
        label: 'Time Investment',
        description: 'Will this take years? I need results'
      },
      {
        id: 'difficulty',
        icon: '🏔️',
        label: 'Difficulty',
        description: 'Is this too hard for someone like me?'
      },
      {
        id: 'relevance',
        icon: '🎯',
        label: 'Staying Relevant',
        description: 'Tech changes fast - will I learn the right things?'
      },
      {
        id: 'job_market',
        icon: '💼',
        label: 'Job Market',
        description: 'Will I actually be employable?'
      },
      {
        id: 'none',
        icon: '✨',
        label: "I'm Just Excited",
        description: "No major concerns - let's go!"
      }
    ]
  }
];

// ============================================================================
// STEP 3B: INTERMEDIATE BRANCH QUESTIONS
// ============================================================================

export const INTERMEDIATE_QUESTIONS: Question[] = [
  {
    id: 'intermediate_situation',
    question: 'What best describes your current situation?',
    subtitle: "Let's understand where you're at",
    type: 'single-select',
    options: [
      {
        id: 'employed_growing',
        icon: '📈',
        label: 'Working & Growing',
        description: 'I have a dev job and want to level up'
      },
      {
        id: 'employed_stuck',
        icon: '🔒',
        label: 'Working but Stuck',
        description: "I have a job but feel like I've plateaued"
      },
      {
        id: 'job_hunting',
        icon: '🎯',
        label: 'Job Hunting',
        description: 'I have skills but need to land a role'
      },
      {
        id: 'freelance',
        icon: '🏠',
        label: 'Freelancing',
        description: 'Working independently, want to improve'
      },
      {
        id: 'self_taught',
        icon: '📚',
        label: 'Self-Taught Journey',
        description: 'Learning on my own, building projects'
      }
    ]
  },
  {
    id: 'intermediate_challenge',
    question: "What's your biggest challenge right now?",
    subtitle: "We'll focus your path on breaking through",
    type: 'single-select',
    options: [
      {
        id: 'knowledge_gaps',
        icon: '🧩',
        label: 'Knowledge Gaps',
        description: 'I know some things well but have blind spots'
      },
      {
        id: 'system_design',
        icon: '🏗️',
        label: 'Bigger Picture',
        description: 'I can code but struggle with architecture'
      },
      {
        id: 'modern_tools',
        icon: '🔧',
        label: 'Modern Tooling',
        description: 'I need to catch up on current best practices'
      },
      {
        id: 'portfolio',
        icon: '💼',
        label: 'Portfolio & Proof',
        description: 'I need better projects to show my skills'
      },
      {
        id: 'specialization',
        icon: '🎯',
        label: 'Finding My Niche',
        description: "I don't know what to specialize in"
      }
    ]
  },
  {
    id: 'intermediate_goal',
    question: 'Where do you want to be in 12 months?',
    subtitle: "Let's define your target",
    type: 'single-select',
    options: [
      {
        id: 'senior_role',
        icon: '⬆️',
        label: 'Senior Developer',
        description: 'Ready to lead features and mentor others'
      },
      {
        id: 'specialist',
        icon: '🔬',
        label: 'Deep Specialist',
        description: 'Expert in a specific area or technology'
      },
      {
        id: 'fullstack',
        icon: '🔄',
        label: 'Fullstack Capable',
        description: 'Comfortable across the entire stack'
      },
      {
        id: 'new_role',
        icon: '🚀',
        label: 'New Opportunity',
        description: 'Better job, better company, better comp'
      },
      {
        id: 'indie',
        icon: '💡',
        label: 'Build My Own Thing',
        description: 'Launch my own product or startup'
      }
    ]
  }
];

// ============================================================================
// STEP 3C: ADVANCED BRANCH QUESTIONS
// ============================================================================

export const ADVANCED_QUESTIONS: Question[] = [
  {
    id: 'advanced_direction',
    question: "What's your primary growth direction?",
    subtitle: 'At your level, focus is everything',
    type: 'single-select',
    options: [
      {
        id: 'technical_depth',
        icon: '🔬',
        label: 'Technical Depth',
        description: 'Become a recognized expert in my domain'
      },
      {
        id: 'technical_breadth',
        icon: '🌐',
        label: 'Technical Breadth',
        description: 'Expand into adjacent areas strategically'
      },
      {
        id: 'architecture',
        icon: '🏛️',
        label: 'Architecture & Design',
        description: 'Move toward system design and tech decisions'
      },
      {
        id: 'leadership',
        icon: '👥',
        label: 'Technical Leadership',
        description: 'Lead teams while staying technical'
      },
      {
        id: 'entrepreneurship',
        icon: '🚀',
        label: 'Entrepreneurship',
        description: 'Build and launch my own products'
      }
    ]
  },
  {
    id: 'advanced_interest',
    question: 'What emerging area interests you most?',
    subtitle: 'Stay ahead of the curve',
    type: 'single-select',
    options: [
      {
        id: 'ai_integration',
        icon: '🤖',
        label: 'AI Integration',
        description: 'Building AI-powered features and applications'
      },
      {
        id: 'platform_engineering',
        icon: '🔧',
        label: 'Platform Engineering',
        description: 'Internal developer experience and tooling'
      },
      {
        id: 'edge_computing',
        icon: '⚡',
        label: 'Edge & Performance',
        description: 'Pushing the boundaries of speed and distribution'
      },
      {
        id: 'security',
        icon: '🔒',
        label: 'Security & Privacy',
        description: 'Building secure, compliant systems'
      },
      {
        id: 'web3',
        icon: '🔗',
        label: 'Web3 & Decentralization',
        description: 'Blockchain, smart contracts, decentralized apps'
      },
      {
        id: 'keep_current',
        icon: '📍',
        label: 'Master Current Stack',
        description: 'Go deeper in what I already know'
      }
    ]
  },
  {
    id: 'advanced_constraint',
    question: "What's your main constraint?",
    subtitle: "Let's optimize for your reality",
    type: 'single-select',
    options: [
      {
        id: 'time',
        icon: '⏰',
        label: 'Limited Time',
        description: 'I need high-impact, focused learning'
      },
      {
        id: 'application',
        icon: '🎯',
        label: 'No Application Context',
        description: "I learn but can't apply at work"
      },
      {
        id: 'motivation',
        icon: '🔥',
        label: 'Staying Motivated',
        description: 'Hard to stay engaged without novelty'
      },
      {
        id: 'direction',
        icon: '🧭',
        label: 'Unclear Direction',
        description: "Too many options, not sure what's worth it"
      },
      {
        id: 'none',
        icon: '✅',
        label: 'Ready to Dive In',
        description: 'I just need the right content'
      }
    ]
  }
];

// ============================================================================
// STEP 4: COMMITMENT QUESTION (All branches)
// ============================================================================

export const COMMITMENT_QUESTION: Question = {
  id: 'commitment',
  question: 'How much time can you realistically dedicate?',
  subtitle: "Be honest - we'll build a path that fits your life",
  type: 'single-select',
  options: [
    {
      id: 'casual',
      icon: '🌙',
      label: 'A few hours per week',
      description: '2-5 hours, learning alongside life',
      note: 'Perfect for steady, sustainable progress'
    },
    {
      id: 'part_time',
      icon: '📅',
      label: 'Part-time focus',
      description: '10-15 hours per week',
      note: 'Significant progress in months'
    },
    {
      id: 'dedicated',
      icon: '💪',
      label: 'Dedicated learner',
      description: '20-30 hours per week',
      note: 'Accelerated path possible'
    },
    {
      id: 'immersive',
      icon: '🔥',
      label: 'Full immersion',
      description: '40+ hours per week',
      note: 'Bootcamp-style intensity'
    }
  ]
};

// ============================================================================
// STEP 5: FREE INPUT
// ============================================================================

export const FREE_INPUT_QUESTION: Question = {
  id: 'free_input',
  question: 'Anything else the Oracle should know?',
  subtitle: 'Share context that might help personalize your path',
  type: 'textarea',
  placeholder: `Examples:
• I'm a designer wanting to code my own designs
• I have a startup idea I want to build
• I need to pass technical interviews
• I'm interested in [specific technology]
• I've tried learning before but...`,
  optional: true,
  maxLength: 500
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getBranchQuestions(experienceLevel: ExperienceLevel): Question[] {
  switch (experienceLevel) {
    case 'beginner':
      return BEGINNER_QUESTIONS;
    case 'intermediate':
      return INTERMEDIATE_QUESTIONS;
    case 'advanced':
      return ADVANCED_QUESTIONS;
    default:
      return BEGINNER_QUESTIONS;
  }
}

export function getExperienceQuestion(domain: DomainId): Question {
  return EXPERIENCE_QUESTIONS[domain] || EXPERIENCE_QUESTIONS.frontend;
}

export interface OracleAnswers {
  domain: DomainId;
  experience: ExperienceLevel;
  branchAnswers: Record<string, string | string[]>;
  commitment: string;
  freeInput?: string;
}

export function buildOraclePayload(answers: OracleAnswers) {
  return {
    domain: answers.domain,
    experience_level: answers.experience,
    motivation: answers.branchAnswers['beginner_motivation'] || answers.branchAnswers['intermediate_situation'] || answers.branchAnswers['advanced_direction'],
    learning_style: answers.branchAnswers['beginner_learning_style'],
    concerns: answers.branchAnswers['beginner_concerns'],
    challenge: answers.branchAnswers['intermediate_challenge'],
    goal: answers.branchAnswers['beginner_motivation'] || answers.branchAnswers['intermediate_goal'] || answers.branchAnswers['advanced_direction'],
    interest: answers.branchAnswers['advanced_interest'],
    constraint: answers.branchAnswers['advanced_constraint'],
    commitment: answers.commitment,
    additional_context: answers.freeInput || '',
    // Include all raw answers for maximum context
    all_answers: answers.branchAnswers
  };
}
