# Supabase Database Schema

This directory contains the PostgreSQL schema and seed data for the Course Learning Platform.

## Schema Overview

The schema supports:
- **Udemy-quality course categorization** with hierarchical taxonomy
- **Career Oracle AI-powered discovery** with skills, job market data, and predictions
- **Knowledge Map visualization** with course connections and prerequisites
- **User progress tracking** with gamification (XP, streaks, achievements)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TAXONOMY & CATEGORIZATION                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  categories ──────┬──> subcategories ──────┬──> topics                          │
│  (Development)    │    (Web Dev)           │    (React, Node.js)                │
│                   │                        │                                    │
│                   └────────────────────────┴──> courses                         │
│                                                   │                             │
└───────────────────────────────────────────────────┼─────────────────────────────┘
                                                    │
┌───────────────────────────────────────────────────┼─────────────────────────────┐
│                           COURSE CONTENT                                        │
├───────────────────────────────────────────────────┼─────────────────────────────┤
│                                                   │                             │
│  courses ──────────────> chapters ──────────────> sections ──────> concepts     │
│  (React Fund.)           (Hooks)                  (useState)      (definition)  │
│      │                                                                          │
│      ├──> course_skills (skills taught)                                         │
│      ├──> course_prerequisites (required courses)                               │
│      └──> course_connections (knowledge map edges)                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SKILLS TAXONOMY                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  skills ──────────┬──> skill_prerequisites (React requires JavaScript)         │
│  (React, TypeScript)   skill_relations (React + TypeScript = complementary)    │
│      │                                                                          │
│      ├──> course_skills                                                         │
│      ├──> career_goal_skills                                                    │
│      ├──> job_posting_skills                                                    │
│      └──> skill_demand_predictions (AI forecasts)                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LEARNING PATHS & CAREER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  learning_paths ──────┬──> learning_path_courses (ordered courses)              │
│  (Frontend Dev)       └──> learning_path_skills (skills gained)                 │
│                                                                                 │
│  career_goals ────────┬──> career_goal_skills (required skills)                 │
│  (Become Full Stack)  └──> recommended_path (suggested learning path)           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              JOB MARKET DATA                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  companies ───────────> job_postings ──────> job_posting_skills                 │
│  (Acme Tech)           (Senior Dev)          (React: 4/5 required)              │
│                                                                                 │
│  industry_trends                                                                │
│  skill_demand_predictions                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER DATA                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  user_profiles ───────┬──> user_skills (what they know)                         │
│  (auth.users)         ├──> enrollments (courses enrolled)                       │
│                       ├──> section_progress (granular progress)                 │
│                       ├──> learning_path_enrollments                            │
│                       ├──> user_achievements                                    │
│                       ├──> user_daily_activity (streaks)                        │
│                       ├──> bookmarks                                            │
│                       └──> user_generated_paths (AI-generated paths)            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Tables

### Taxonomy
| Table | Purpose |
|-------|---------|
| `categories` | Top-level categories (Development, Data Science) |
| `subcategories` | Second level (Web Development, Mobile) |
| `topics` | Specific technologies (React, Node.js) |

### Skills
| Table | Purpose |
|-------|---------|
| `skills` | Master skill definitions with market data |
| `skill_prerequisites` | Skill dependency graph |
| `skill_relations` | Complementary/related skills |
| `skill_demand_predictions` | AI market predictions |

### Courses
| Table | Purpose |
|-------|---------|
| `courses` | Main course content |
| `chapters` | Course chapters |
| `sections` | Lessons, videos, exercises |
| `concepts` | Atomic learning units |
| `course_skills` | Skills taught by courses |
| `course_prerequisites` | Course dependency graph |
| `course_connections` | Knowledge map edges |

### Learning Paths
| Table | Purpose |
|-------|---------|
| `learning_paths` | Curated or AI-generated paths |
| `learning_path_courses` | Ordered courses in path |
| `career_goals` | Target roles with market data |
| `career_goal_skills` | Required skills for goals |

### Job Market
| Table | Purpose |
|-------|---------|
| `companies` | Employer profiles |
| `job_postings` | Job listings |
| `job_posting_skills` | Required skills per job |
| `industry_trends` | Industry growth data |

### User Data
| Table | Purpose |
|-------|---------|
| `user_profiles` | Extended user info |
| `user_skills` | User's skill proficiency |
| `enrollments` | Course enrollments |
| `section_progress` | Granular completion tracking |
| `user_achievements` | Unlocked achievements |
| `user_daily_activity` | Streak tracking |
| `user_generated_paths` | AI-personalized paths |

## Usage

### Apply Migrations

```bash
# Using Supabase CLI
supabase db push

# Or directly with psql
psql -h db.xxx.supabase.co -U postgres -d postgres -f migrations/001_initial_schema.sql
```

### Seed Data

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f seed.sql
```

### Row Level Security

RLS is enabled on user tables. Key policies:
- Users can only access their own data
- Public read access to catalog tables (courses, skills, paths)
- Only published courses are visible to anonymous users

## Views

| View | Purpose |
|------|---------|
| `course_overview` | Course with category breadcrumb and counts |
| `user_learning_summary` | User stats: XP, level, courses completed |
| `skill_demand_summary` | Skill with latest demand prediction |

## Functions

| Function | Purpose |
|----------|---------|
| `calculate_level(xp)` | Calculate user level from XP |
| `update_updated_at_column()` | Auto-update timestamps |
| `update_course_search_vector()` | Full-text search indexing |
