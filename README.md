# Course Learning Platform

A comprehensive learning management system built with Next.js 15, featuring adaptive content, progress tracking, gamification, and interactive learning experiences.

## Getting Started

```bash
npm run dev    # Start development server
npm run build  # Production build
npm run test   # Run tests
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Feature Modules Overview

### Theme System (`features/theme`)
Light/dark/system theme management with localStorage persistence and CSS variable-based theming.

**Key capabilities:**
- Light, dark, and system preference modes
- Automatic system theme detection
- Persistent theme storage
- CSS-based theme application

---

### Bookmarks (`features/bookmarks`)
Course content bookmarking with notes, tags, and filtering.

**Key capabilities:**
- Bookmark any course section with custom notes
- Tag-based organization
- Full-text search across bookmarks
- Sortable by date, course, or chapter
- Highlighted text capture

---

### Progress Tracking (`features/progress`)
Comprehensive learning progress management across courses, chapters, and videos.

**Key capabilities:**
- Video watch progress with resume position
- Chapter and section completion tracking
- Quiz score recording with attempt history
- Course-level progress aggregation
- "Continue Learning" functionality
- Progress export (JSON/CSV)

---

### Skill Progress (`features/skill-progress`)
Duolingo-style skill progression system with XP, levels, and visual representations.

**Key capabilities:**
- Skill categories (frontend, backend, database, devops, etc.)
- XP-based level progression (beginner to expert)
- Crown system (0-5 crowns per skill)
- Skill radar chart visualization
- Progress ring components
- Skill tree with prerequisites

---

### Certificates (`features/certificates`)
Course completion certificates with verification and social sharing.

**Key capabilities:**
- Multiple certificate templates (classic, modern, professional, elegant)
- Unique verification codes
- QR code verification
- Social sharing (LinkedIn, Twitter, Facebook)
- PDF/PNG/JPG export
- Certificate gallery
- Metadata (hours, modules, quiz scores)

---

### Learning Streaks (`features/streaks`)
Gamified daily learning streak system inspired by Duolingo.

**Key capabilities:**
- Daily streak tracking with midnight reset
- Configurable daily goals (5/10/15/30 minutes)
- Streak freeze tokens to protect streaks
- Milestone celebrations (7, 14, 30, 60, 100, 365 days)
- Confetti animations on achievements
- Daily progress ring visualization

---

### Chapter System (`features/chapter`)
Core chapter viewing with multiple layout modes and section management.

**Key capabilities:**
- Multiple view modes (classic, expandable, IDE)
- Layout template system with slots
- Video playback with speed control (0.5x-2x)
- Keyboard shortcuts for navigation
- Section-based content organization
- Chapter graph with prerequisites
- Adaptive chapter views

---

### Code Playground (`features/code-playground`)
Interactive code editor with live preview and execution.

**Key capabilities:**
- Multi-language support (JS, JSX, TS, TSX, CSS, HTML, JSON)
- File explorer with tabs
- Real-time code execution
- Console output capture
- Iframe-based preview
- Persistent storage of code changes

---

### Adaptive Content (`features/adaptive-content`)
AI-powered content density adjustment based on learner behavior signals.

**Key capabilities:**
- Comprehension level detection (beginner/intermediate/advanced)
- Behavior signal collection:
  - Quiz performance
  - Code playground interactions
  - Section time tracking
  - Video playback patterns (rewinds, pauses)
  - Navigation patterns
- Content adaptation:
  - Simplified examples for beginners
  - Advanced challenges for experts
  - Dynamic hint visibility
  - Pace recommendations

---

### Course Overview (`features/overview`)
Curriculum visualization with knowledge map and category navigation.

**Key capabilities:**
- 100+ node curriculum graph
- Category-based filtering (HTML/CSS, JS, TS, React, Vue, Angular, etc.)
- Node status tracking (completed, in_progress, available, locked)
- Lazy-loaded variant components
- Interactive canvas-based visualization

---

### Path Comparison (`features/path-comparison`)
Side-by-side learning path comparison for decision making.

**Key capabilities:**
- Compare up to 3 learning paths
- Visual comparison cards
- Metrics comparison (hours, skills, courses)
- Add/remove paths from comparison
- Modal-based comparison view

---

### Shareable Links (`features/shareable-links`)
Social sharing of learning paths with OG image generation.

**Key capabilities:**
- URL-based path sharing
- Open Graph meta tag support
- Dynamic OG image generation
- Progress inclusion in shared links
- Copy-to-clipboard functionality
- Platform-specific sharing (LinkedIn, Twitter, etc.)

---

### Goal Path Generator (`features/goal-path`)
Intent-based personalized learning path generation.

**Key capabilities:**
- Goal input with natural language
- Time commitment configuration (5-40 hours/week)
- Timeline selection (1-24 months)
- Focus area selection (frontend, backend, mobile, etc.)
- Learning style preferences (video, text, project-based)
- Skill level assessment
- AI-generated curriculum with milestones
- Confidence scoring

---

## Architecture

### Directory Structure
```
src/app/features/
  ├── theme/           # Theme management
  ├── bookmarks/       # Bookmarking system
  ├── progress/        # Progress tracking
  ├── skill-progress/  # Gamified skill system
  ├── certificates/    # Certificate generation
  ├── streaks/         # Learning streaks
  ├── chapter/         # Chapter viewing
  ├── code-playground/ # Interactive code editor
  ├── adaptive-content/# Adaptive learning
  ├── overview/        # Curriculum visualization
  ├── path-comparison/ # Path comparison
  ├── shareable-links/ # Social sharing
  └── goal-path/       # Path generation
```

### Feature Module Pattern
Each feature follows a consistent structure:
```
feature-name/
  ├── index.ts           # Public exports
  ├── lib/               # Business logic, types, hooks
  │   ├── types.ts       # TypeScript interfaces
  │   ├── use*.ts        # React hooks
  │   └── *Storage.ts    # localStorage utilities
  └── components/        # React components
      └── index.ts       # Component exports
```

### Key Technologies
- **Next.js 15** - App Router
- **React 18** - Client components with hooks
- **TypeScript** - Full type coverage
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide Icons** - Icon system
- **localStorage** - Client-side persistence

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
