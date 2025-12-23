# Dynamic Course Generation Platform - Solution Design

## Executive Summary

This document outlines the architecture for a Udemy-like platform that generates course content dynamically as users progress. Content is created on-demand from three sources: LLM training data for foundational knowledge, web search for current information, and YouTube for visual tutorials.

---

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                                   │
│  Topic Selection → Learning Path → Lesson View → Path Choice → Continue    │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION LAYER                                 │
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Content   │  │    Path     │  │   Cache     │  │   Content   │       │
│  │   Router    │  │  Generator  │  │   Manager   │  │   Merger    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │  LLM ENGINE  │ │  WEB SEARCH  │ │   YOUTUBE    │
           │              │ │    ENGINE    │ │    ENGINE    │
           │ Foundations  │ │   Current    │ │   Visual     │
           │ Explanations │ │    Data      │ │  Tutorials   │
           └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE LAYER                                  │
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Courses   │  │   Lessons   │  │    Paths    │  │   YouTube   │       │
│  │    Store    │  │    Store    │  │    Store    │  │    Cache    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Schema

### 1. Course Schema

```json
{
  "course": {
    "id": "uuid",
    "slug": "string (url-friendly)",
    "title": "string",
    "description": "string",
    "domain": "string (e.g., 'web-development', 'data-science')",
    "difficulty_level": "enum: beginner | intermediate | advanced",
    "estimated_hours": "number",
    "prerequisites": ["course_id"],
    "tags": ["string"],
    "thumbnail_url": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_metadata": {
      "initial_prompt": "string",
      "llm_model_version": "string",
      "generation_timestamp": "timestamp"
    },
    "stats": {
      "total_enrollments": "number",
      "completion_rate": "number (0-1)",
      "average_rating": "number (1-5)",
      "total_lessons": "number",
      "total_paths_discovered": "number"
    }
  }
}
```

### 2. Lesson Schema

```json
{
  "lesson": {
    "id": "uuid",
    "course_id": "uuid (foreign key)",
    "slug": "string",
    "title": "string",
    "order_in_path": "number",
    "estimated_minutes": "number",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    
    "content": {
      "core_explanation": {
        "source": "llm",
        "markdown": "string",
        "generated_at": "timestamp"
      },
      "analogies": [{
        "source": "llm",
        "analogy_text": "string",
        "target_audience": "string (e.g., 'visual learners', 'developers')"
      }],
      "terminology": [{
        "term": "string",
        "definition": "string",
        "source": "llm"
      }],
      "step_by_step": {
        "source": "llm",
        "steps": [{
          "step_number": "number",
          "title": "string",
          "explanation": "string",
          "code_snippet": "string | null"
        }]
      },
      "code_examples": [{
        "source": "llm",
        "language": "string",
        "title": "string",
        "description": "string",
        "code": "string",
        "output": "string | null"
      }],
      "common_misconceptions": [{
        "source": "llm",
        "misconception": "string",
        "reality": "string",
        "why_it_matters": "string"
      }]
    },
    
    "current_info": {
      "fetched_at": "timestamp",
      "ttl_hours": "number (time-to-live before refresh)",
      "tool_docs": [{
        "source": "web_search",
        "tool_name": "string",
        "version": "string",
        "summary": "string",
        "official_url": "string",
        "key_features": ["string"]
      }],
      "job_market": {
        "source": "web_search",
        "demand_level": "enum: low | medium | high | very_high",
        "average_salary_range": "string",
        "top_hiring_companies": ["string"],
        "related_job_titles": ["string"],
        "search_timestamp": "timestamp"
      },
      "market_stats": {
        "source": "web_search",
        "adoption_rate": "string",
        "market_share": "string",
        "growth_trend": "string",
        "notable_users": ["string"],
        "search_timestamp": "timestamp"
      }
    },
    
    "youtube_resources": {
      "fetched_at": "timestamp",
      "ttl_hours": "number",
      "technique_videos": [{
        "video_id": "string",
        "title": "string",
        "channel_name": "string",
        "channel_id": "string",
        "duration_seconds": "number",
        "view_count": "number",
        "published_at": "timestamp",
        "description_snippet": "string",
        "relevance_score": "number (0-1)",
        "video_type": "technique_short"
      }],
      "project_videos": [{
        "video_id": "string",
        "title": "string",
        "channel_name": "string",
        "channel_id": "string",
        "duration_seconds": "number",
        "view_count": "number",
        "published_at": "timestamp",
        "description_snippet": "string",
        "relevance_score": "number (0-1)",
        "video_type": "full_project",
        "technologies_used": ["string"]
      }]
    },
    
    "structural_metadata": {
      "prerequisites_concepts": ["string"],
      "learning_objectives": ["string"],
      "key_takeaways": ["string"],
      "difficulty_within_course": "number (1-10)"
    }
  }
}
```

### 3. Learning Path Schema

```json
{
  "path": {
    "id": "uuid",
    "course_id": "uuid",
    "name": "string (e.g., 'Frontend Focus', 'Full Stack Deep Dive')",
    "description": "string",
    "created_at": "timestamp",
    "created_by_user_id": "uuid (first user to traverse)",
    
    "path_sequence": [{
      "order": "number",
      "lesson_id": "uuid",
      "is_optional": "boolean",
      "branch_point": "boolean"
    }],
    
    "stats": {
      "times_taken": "number",
      "average_completion_rate": "number (0-1)",
      "average_satisfaction": "number (1-5)",
      "average_completion_hours": "number"
    },
    
    "branch_options": [{
      "from_lesson_id": "uuid",
      "options": [{
        "next_lesson_id": "uuid",
        "choice_label": "string",
        "choice_description": "string",
        "times_chosen": "number"
      }]
    }]
  }
}
```

### 4. User Progress Schema

```json
{
  "user_progress": {
    "id": "uuid",
    "user_id": "uuid",
    "course_id": "uuid",
    "current_path_id": "uuid | null",
    "started_at": "timestamp",
    "last_activity_at": "timestamp",
    
    "completed_lessons": [{
      "lesson_id": "uuid",
      "completed_at": "timestamp",
      "time_spent_minutes": "number"
    }],
    
    "current_position": {
      "lesson_id": "uuid",
      "started_at": "timestamp"
    },
    
    "path_history": [{
      "from_lesson_id": "uuid",
      "to_lesson_id": "uuid",
      "choice_made_at": "timestamp",
      "was_new_content": "boolean"
    }]
  }
}
```

---

## Prompt Templates

### PROMPT 1: Course Structure Generation

**Purpose:** Generate the initial skeleton of a course when a user requests a new topic.

**Trigger:** User enters a topic that doesn't exist in the database.

```
SYSTEM:
You are a curriculum designer for an adaptive learning platform. Your role is to create comprehensive, well-structured course outlines that guide learners from foundational concepts to practical application.

USER:
Create a course structure for: {{TOPIC}}

Target audience: {{AUDIENCE_LEVEL}} (beginner/intermediate/advanced)
Domain context: {{DOMAIN}} (e.g., web development, data science, devops)

Generate a course structure with the following requirements:

1. COURSE METADATA
   - Title (compelling, specific)
   - Description (2-3 sentences, value proposition)
   - Prerequisites (list of concepts/skills needed)
   - Estimated total hours
   - Tags for discoverability

2. LEARNING PATH STRUCTURE
   Create a logical progression of 8-15 lessons covering:
   - Foundation concepts (what must be understood first)
   - Core skills (the meat of the topic)
   - Practical application (hands-on implementation)
   - Advanced topics (optional deep dives)
   
   For each lesson, provide:
   - Title
   - 1-sentence description
   - Estimated minutes
   - 3 learning objectives
   - Difficulty score (1-10)
   - Prerequisites from earlier lessons

3. BRANCH POINTS
   Identify 2-4 points where learners might want different paths:
   - "Go deeper" options (more theory/detail)
   - "Go practical" options (hands-on projects)
   - "Go adjacent" options (related but different topics)

Output as JSON matching this structure:
{
  "course": {
    "title": "",
    "description": "",
    "prerequisites": [],
    "estimated_hours": 0,
    "tags": [],
    "difficulty_level": ""
  },
  "lessons": [
    {
      "order": 1,
      "title": "",
      "description": "",
      "estimated_minutes": 0,
      "learning_objectives": [],
      "difficulty_score": 0,
      "prerequisite_lessons": [],
      "is_branch_point": false
    }
  ],
  "branch_points": [
    {
      "after_lesson_order": 0,
      "options": [
        {
          "type": "deeper|practical|adjacent",
          "label": "",
          "description": "",
          "leads_to_topic": ""
        }
      ]
    }
  ]
}
```

---

### PROMPT 2: Core Lesson Content Generation

**Purpose:** Generate the foundational educational content for a lesson using LLM knowledge.

**Trigger:** User navigates to a lesson that hasn't been generated yet, or needs the core content portion.

```
SYSTEM:
You are an expert educator creating lesson content for an online learning platform. Your explanations are clear, memorable, and progressively build understanding. You write for {{AUDIENCE_LEVEL}} learners.

USER:
Generate comprehensive lesson content for:

TOPIC: {{LESSON_TITLE}}
CONTEXT: This is lesson {{LESSON_ORDER}} of {{TOTAL_LESSONS}} in a course about {{COURSE_TOPIC}}
PREREQUISITES COVERED: {{LIST_OF_PREVIOUS_LESSONS}}
LEARNING OBJECTIVES:
{{LEARNING_OBJECTIVES}}

Generate content for each section below:

---

## 1. CORE EXPLANATION
Write a thorough explanation (400-600 words) that:
- Starts with WHY this matters (motivation)
- Explains WHAT it is (definition and scope)
- Describes HOW it works (mechanism/process)
- Uses clear, jargon-free language where possible
- Builds on concepts from prerequisite lessons

---

## 2. ANALOGIES AND METAPHORS
Provide 2-3 analogies that make this concept click:
- One for visual/spatial thinkers
- One for logical/systematic thinkers  
- One real-world analogy from everyday life

For each analogy:
- The analogy itself
- How the analogy maps to the actual concept
- Where the analogy breaks down (limitations)

---

## 3. KEY TERMINOLOGY
List 5-10 essential terms with:
- The term
- Clear definition (1-2 sentences)
- Example of usage in context
- Common confusion with similar terms (if any)

---

## 4. STEP-BY-STEP BREAKDOWN
If this topic involves a process or procedure, break it into steps:
- Number each step clearly
- Explain the purpose of each step
- Include decision points or variations
- Note common mistakes at each step

---

## 5. CODE EXAMPLES (if applicable)
Provide {{LANGUAGE}} code examples:

EXAMPLE A: Minimal example (simplest possible demonstration)
- Title
- What it demonstrates
- The code (well-commented)
- Expected output
- Key lines explained

EXAMPLE B: Realistic example (how you'd actually use this)
- Title  
- Scenario/use case
- The code (well-commented)
- Expected output
- Variations to try

---

## 6. COMMON MISCONCEPTIONS
List 3-5 misconceptions learners often have:
- The misconception (what people wrongly believe)
- The reality (what's actually true)
- Why this misconception exists
- How to remember the correct understanding

---

## 7. STRUCTURAL METADATA
- Key takeaways (3-5 bullet points)
- Concepts this lesson unlocks (what can be learned next)
- Practice suggestions (what to try to solidify learning)

Output as JSON:
{
  "core_explanation": {
    "markdown": ""
  },
  "analogies": [
    {
      "target_audience": "",
      "analogy_text": "",
      "mapping": "",
      "limitations": ""
    }
  ],
  "terminology": [
    {
      "term": "",
      "definition": "",
      "usage_example": "",
      "commonly_confused_with": ""
    }
  ],
  "step_by_step": {
    "steps": [
      {
        "step_number": 1,
        "title": "",
        "explanation": "",
        "code_snippet": null,
        "common_mistakes": ""
      }
    ]
  },
  "code_examples": [
    {
      "type": "minimal|realistic",
      "language": "",
      "title": "",
      "description": "",
      "code": "",
      "output": "",
      "key_lines_explained": ""
    }
  ],
  "common_misconceptions": [
    {
      "misconception": "",
      "reality": "",
      "why_exists": "",
      "memory_aid": ""
    }
  ],
  "structural_metadata": {
    "key_takeaways": [],
    "unlocks_concepts": [],
    "practice_suggestions": []
  }
}
```

---

### PROMPT 3: Web Search - Tool Documentation

**Purpose:** Fetch current documentation and version information for tools/libraries mentioned in a lesson.

**Trigger:** When generating or refreshing lesson content that references specific tools.

```
SYSTEM:
You are a technical researcher gathering current information about development tools and libraries. Search the web for accurate, up-to-date information. Prioritize official sources.

USER:
I need current documentation information for the following tools/technologies related to {{LESSON_TOPIC}}:

Tools to research: {{TOOL_LIST}}

For EACH tool, search and provide:

1. BASIC INFO
   - Official name
   - Current stable version (as of search date)
   - Official website URL
   - Official documentation URL
   - GitHub repository (if open source)

2. CURRENT STATUS
   - Latest release date
   - Release frequency (active/maintenance/deprecated)
   - Breaking changes in recent versions (if any)

3. KEY FEATURES
   - Main capabilities (5-7 bullet points)
   - What problems it solves
   - Primary use cases

4. ECOSYSTEM
   - Common companion tools/libraries
   - Framework integrations
   - Popular alternatives

5. GETTING STARTED
   - Installation command(s)
   - Minimal setup requirements
   - Link to quickstart guide

Format your findings as JSON:
{
  "tools": [
    {
      "tool_name": "",
      "current_version": "",
      "official_url": "",
      "docs_url": "",
      "github_url": "",
      "last_release_date": "",
      "status": "active|maintenance|deprecated",
      "key_features": [],
      "primary_use_cases": [],
      "ecosystem": {
        "companion_tools": [],
        "alternatives": []
      },
      "getting_started": {
        "install_command": "",
        "requirements": "",
        "quickstart_url": ""
      },
      "sources_consulted": [],
      "search_timestamp": ""
    }
  ]
}

Note: If information cannot be found or verified, indicate "unverified" rather than guessing.
```

---

### PROMPT 4: Web Search - Job Market Relevance

**Purpose:** Provide learners with career context and motivation by showing job market demand.

**Trigger:** When generating course overview or upon user request for career relevance.

```
SYSTEM:
You are a career research analyst investigating job market demand for technical skills. Search for current, accurate employment data. Use job boards, industry reports, and salary databases.

USER:
Research the job market relevance for: {{SKILL_OR_TECHNOLOGY}}

Context: This is for a course about {{COURSE_TOPIC}}
Related skills in this course: {{RELATED_SKILLS_LIST}}

Search and provide:

1. DEMAND INDICATORS
   - Approximate number of job listings (from major job boards)
   - Trend direction (growing/stable/declining)
   - Demand level assessment (low/medium/high/very_high)

2. SALARY INFORMATION
   - Entry-level salary range
   - Mid-level salary range  
   - Senior-level salary range
   - Geographic variations (if significant)
   - Note the currency and region

3. JOB TITLES
   - Common job titles requiring this skill
   - Seniority levels where this skill appears
   - Industries hiring for this skill

4. HIRING COMPANIES
   - Types of companies hiring (startups, enterprises, agencies)
   - Notable companies known for using this technology
   - Industry sectors with highest demand

5. SKILL COMBINATIONS
   - Skills commonly requested alongside this one
   - Certifications that boost employability
   - Portfolio/project types employers value

6. MARKET CONTEXT
   - Why demand is at current level
   - Future outlook (next 1-2 years)
   - Competing or complementary technologies

Format as JSON:
{
  "skill": "",
  "search_date": "",
  "demand": {
    "level": "low|medium|high|very_high",
    "trend": "growing|stable|declining",
    "job_listing_estimate": "",
    "confidence": "high|medium|low"
  },
  "salary": {
    "currency": "",
    "region": "",
    "entry_level": "",
    "mid_level": "",
    "senior_level": "",
    "notes": ""
  },
  "job_titles": [
    {
      "title": "",
      "seniority": "",
      "frequency": "common|occasional|rare"
    }
  ],
  "hiring_landscape": {
    "company_types": [],
    "notable_companies": [],
    "top_industries": []
  },
  "skill_combinations": {
    "commonly_paired_with": [],
    "valuable_certifications": [],
    "portfolio_recommendations": []
  },
  "market_context": {
    "demand_drivers": "",
    "future_outlook": "",
    "related_technologies": []
  },
  "sources": []
}
```

---

### PROMPT 5: Web Search - Market Statistics

**Purpose:** Provide context on technology adoption, market share, and industry trends.

**Trigger:** When generating course overview or for lessons about technology choices/comparisons.

```
SYSTEM:
You are a market research analyst investigating technology adoption and market statistics. Search for data from reputable sources: industry reports, surveys, analytics platforms, and official statistics.

USER:
Research market statistics for: {{TECHNOLOGY_OR_TOOL}}

Context: Course topic is {{COURSE_TOPIC}}
Comparison context: {{ALTERNATIVE_TECHNOLOGIES}} (if comparing)

Search and gather:

1. ADOPTION METRICS
   - Market share (if applicable)
   - Usage statistics (downloads, active users, etc.)
   - Growth rate (year-over-year if available)
   - Developer survey rankings

2. ECOSYSTEM SIZE
   - Package/plugin ecosystem size
   - Community size (GitHub stars, Stack Overflow questions)
   - Conference/meetup presence

3. ENTERPRISE ADOPTION
   - Fortune 500 / enterprise usage
   - Case studies from notable companies
   - Industry verticals with highest adoption

4. TRENDS
   - Historical adoption curve
   - Current momentum (accelerating/stable/slowing)
   - Emerging use cases

5. COMPETITIVE POSITION
   - Position relative to alternatives
   - Strengths driving adoption
   - Weaknesses or concerns

Format as JSON:
{
  "technology": "",
  "search_date": "",
  "adoption": {
    "market_share": "",
    "market_share_source": "",
    "usage_metric": "",
    "usage_source": "",
    "growth_rate": "",
    "developer_survey_rank": "",
    "survey_source": ""
  },
  "ecosystem": {
    "packages_plugins_count": "",
    "github_stars": "",
    "stackoverflow_questions": "",
    "community_assessment": ""
  },
  "enterprise": {
    "adoption_level": "early|growing|mainstream|mature",
    "notable_users": [],
    "case_studies": [
      {
        "company": "",
        "use_case": "",
        "source_url": ""
      }
    ]
  },
  "trends": {
    "momentum": "accelerating|stable|slowing|declining",
    "emerging_use_cases": [],
    "trajectory_notes": ""
  },
  "competitive_position": {
    "main_competitors": [],
    "key_advantages": [],
    "key_concerns": []
  },
  "sources": [],
  "data_freshness_note": ""
}
```

---

### PROMPT 6: YouTube Resource Discovery

**Purpose:** Find relevant tutorial videos to supplement lesson content.

**Trigger:** When generating lesson content or when user requests video resources.

**Note:** This prompt is designed to generate search queries and evaluation criteria. Actual YouTube search would use YouTube Data API.

```
SYSTEM:
You are a learning resource curator specializing in finding high-quality educational videos. Your role is to identify the best YouTube search queries and evaluation criteria for finding tutorials on technical topics.

USER:
Find YouTube video recommendations for:

LESSON TOPIC: {{LESSON_TITLE}}
COURSE CONTEXT: {{COURSE_TOPIC}}
SKILL LEVEL: {{AUDIENCE_LEVEL}}
KEY CONCEPTS TO COVER: {{KEY_CONCEPTS_LIST}}

Generate two types of video searches:

---

## TYPE 1: TECHNIQUE VIDEOS (Short, focused tutorials)

Purpose: Quick explanations of specific techniques or concepts
Ideal length: 5-20 minutes
Quantity needed: 3-5 videos

Generate:
A) 3-5 specific search queries optimized for YouTube
   - Use quotation marks for exact phrases where helpful
   - Include skill level indicators (beginner, tutorial, explained)
   - Vary queries to capture different angles

B) Quality evaluation criteria:
   - Title patterns that indicate quality
   - Channel authority signals
   - Minimum view count threshold
   - Maximum age (for time-sensitive topics)
   - Red flags to avoid

C) Relevance scoring factors:
   - Must-have concepts
   - Nice-to-have concepts
   - Deal-breakers (what makes a video irrelevant)

---

## TYPE 2: PROJECT VIDEOS (Full build-along tutorials)

Purpose: Complete projects demonstrating the concept in practice
Ideal length: 30-120 minutes
Quantity needed: 2-3 videos

Generate:
A) 3-5 specific search queries optimized for YouTube
   - Include terms like "project", "build", "from scratch", "full tutorial"
   - Specify technology stack if relevant
   - Include year for freshness when appropriate

B) Quality evaluation criteria:
   - Project complexity appropriate for skill level
   - Code availability (GitHub links)
   - Production quality indicators
   - Instructor credibility signals

C) Relevance scoring factors:
   - Technologies that must be used
   - Project types that align with learning objectives
   - Scope appropriate for lesson context

---

Output as JSON:
{
  "lesson_topic": "",
  "technique_videos": {
    "search_queries": [
      {
        "query": "",
        "rationale": "",
        "expected_result_type": ""
      }
    ],
    "quality_criteria": {
      "min_view_count": 0,
      "max_age_months": 0,
      "preferred_duration_range": "",
      "title_positive_signals": [],
      "title_negative_signals": [],
      "channel_authority_signals": []
    },
    "relevance_scoring": {
      "must_have_concepts": [],
      "nice_to_have_concepts": [],
      "deal_breakers": []
    }
  },
  "project_videos": {
    "search_queries": [
      {
        "query": "",
        "rationale": "",
        "expected_project_type": ""
      }
    ],
    "quality_criteria": {
      "min_view_count": 0,
      "max_age_months": 0,
      "preferred_duration_range": "",
      "must_have_features": [],
      "code_availability_required": true,
      "channel_authority_signals": []
    },
    "relevance_scoring": {
      "required_technologies": [],
      "appropriate_project_types": [],
      "scope_requirements": ""
    }
  }
}
```

---

### PROMPT 7: Content Router Decision

**Purpose:** Determine which content sources are needed for a given request.

**Trigger:** Every time a user requests content (navigates to lesson, asks question, etc.)

```
SYSTEM:
You are a content routing system for an educational platform. Your job is to analyze requests and determine which content sources should be queried to best serve the learner.

Available sources:
1. LLM_CORE: For foundational explanations, analogies, code examples, terminology, misconceptions
2. WEB_DOCS: For current tool documentation, versions, APIs
3. WEB_JOBS: For job market relevance, salary data, career context
4. WEB_STATS: For market statistics, adoption data, trends
5. YOUTUBE_TECHNIQUE: For short tutorial videos on specific techniques
6. YOUTUBE_PROJECT: For full project build-along videos
7. CACHE: For previously generated content (check first)

USER:
Analyze this content request:

REQUEST TYPE: {{REQUEST_TYPE}} (new_lesson | refresh_lesson | user_question | path_branch)
TOPIC: {{TOPIC}}
COURSE CONTEXT: {{COURSE_TOPIC}}
USER LEVEL: {{SKILL_LEVEL}}
SPECIFIC QUESTION (if any): {{USER_QUESTION}}

Existing cached content age:
- Core content: {{CORE_CONTENT_AGE}} (null if none)
- Web docs: {{WEB_DOCS_AGE}} (null if none)  
- Job market: {{JOB_MARKET_AGE}} (null if none)
- Market stats: {{MARKET_STATS_AGE}} (null if none)
- YouTube: {{YOUTUBE_AGE}} (null if none)

Determine:

1. CACHE VALIDITY
   - Which cached content is still valid?
   - Core content: valid indefinitely unless topic is rapidly evolving
   - Web docs: refresh if > 30 days old
   - Job market: refresh if > 90 days old
   - Market stats: refresh if > 60 days old
   - YouTube: refresh if > 30 days old

2. REQUIRED SOURCES
   - Which sources are essential for this request?
   - Which sources would enhance but aren't essential?

3. QUERY PRIORITY
   - Order sources by importance for this specific request
   - Identify any sources that can be skipped entirely

4. PARALLEL VS SEQUENTIAL
   - Which queries can run in parallel?
   - Which depend on results from others?

Output as JSON:
{
  "request_analysis": {
    "request_type": "",
    "topic_category": "",
    "time_sensitivity": "high|medium|low",
    "requires_current_data": true/false
  },
  "cache_decisions": {
    "use_cached_core": true/false,
    "use_cached_web_docs": true/false,
    "use_cached_job_market": true/false,
    "use_cached_market_stats": true/false,
    "use_cached_youtube": true/false
  },
  "source_plan": {
    "essential": ["source_names"],
    "enhancing": ["source_names"],
    "skip": ["source_names"]
  },
  "execution_order": [
    {
      "phase": 1,
      "parallel_sources": ["source_names"],
      "rationale": ""
    },
    {
      "phase": 2,
      "parallel_sources": ["source_names"],
      "depends_on_phase": 1,
      "rationale": ""
    }
  ]
}
```

---

### PROMPT 8: Path Branch Generation

**Purpose:** Generate choices when a user completes a lesson and needs to decide where to go next.

**Trigger:** User completes a lesson that is marked as a branch point.

```
SYSTEM:
You are a learning path advisor. Your role is to present meaningful choices to learners that accommodate different learning styles, goals, and interests while ensuring educational coherence.

USER:
Generate branch options for a learner who just completed:

COMPLETED LESSON: {{LESSON_TITLE}}
COURSE: {{COURSE_TITLE}}
USER'S PATH SO FAR: {{LIST_OF_COMPLETED_LESSONS}}
USER LEVEL: {{SKILL_LEVEL}}
TIME INVESTED: {{HOURS_IN_COURSE}}

AVAILABLE NEXT LESSONS (already exist):
{{LIST_OF_EXISTING_NEXT_LESSONS}}

Generate 3-4 path options:

## OPTION TYPES TO CONSIDER:

1. CONTINUE PATH (Default progression)
   - The natural next lesson in the sequence
   - For learners who want structured guidance

2. GO DEEPER (Theory/Advanced)
   - More detailed exploration of current topic
   - For learners who want thorough understanding
   - May generate new content if doesn't exist

3. GO PRACTICAL (Hands-on/Project)
   - Apply what was just learned
   - For learners who learn by doing
   - Links to project-based content

4. GO ADJACENT (Related topic)
   - Explore connected but different topic
   - For curious learners or those with specific goals
   - May generate new content if doesn't exist

5. REVIEW/REINFORCE (if struggled)
   - Alternative explanation of same concept
   - For learners who need more time

## FOR EACH OPTION PROVIDE:

- Choice label (short, action-oriented)
- Description (1-2 sentences explaining the value)
- Whether it uses existing content or generates new
- Estimated time
- What the learner will be able to do after
- Who this choice is best for

Output as JSON:
{
  "completed_lesson": "",
  "branch_options": [
    {
      "option_number": 1,
      "type": "continue|deeper|practical|adjacent|reinforce",
      "label": "",
      "description": "",
      "existing_content": true/false,
      "existing_lesson_id": "uuid or null",
      "new_content_topic": "string or null",
      "estimated_minutes": 0,
      "outcome": "",
      "best_for": "",
      "popularity_weight": 0.0
    }
  ],
  "recommendation": {
    "suggested_option": 1,
    "reasoning": ""
  }
}
```

---

### PROMPT 9: Content Synthesis/Merge

**Purpose:** Combine content from multiple sources into a cohesive lesson presentation.

**Trigger:** After all source queries complete, before presenting to user.

```
SYSTEM:
You are a content editor assembling educational material from multiple sources into a cohesive, engaging lesson. Your job is to organize, connect, and present information in a way that maximizes learning.

USER:
Synthesize the following content into a unified lesson:

LESSON: {{LESSON_TITLE}}
TARGET AUDIENCE: {{SKILL_LEVEL}}

## SOURCE CONTENT:

### FROM LLM CORE:
{{CORE_EXPLANATION_JSON}}

### FROM WEB DOCS:
{{TOOL_DOCS_JSON}}

### FROM JOB MARKET:
{{JOB_MARKET_JSON}}

### FROM MARKET STATS:
{{MARKET_STATS_JSON}}

### FROM YOUTUBE:
{{YOUTUBE_VIDEOS_JSON}}

---

Create a synthesized lesson with:

1. LESSON HEADER
   - Compelling opening hook
   - Clear learning objectives
   - Estimated time
   - Prerequisites reminder

2. MOTIVATION SECTION
   - Why learn this? (combine job market + market stats)
   - Real-world relevance
   - Keep concise but compelling

3. MAIN CONTENT FLOW
   - Organize core explanation logically
   - Integrate terminology naturally (don't just list)
   - Place analogies at strategic points
   - Embed code examples where they illustrate concepts
   - Highlight current tool versions/docs where relevant

4. VISUAL LEARNING CALLOUTS
   - Where to insert YouTube technique videos
   - Brief intro for each video (why watch this)
   - What to focus on in each video

5. HANDS-ON SECTION
   - Step-by-step with current tool commands
   - Reference project videos for extended practice

6. MISCONCEPTIONS SIDEBAR
   - Present as "Common Pitfalls" or "Watch Out For"
   - Keep visible but not intrusive

7. CAREER CONTEXT FOOTER
   - Brief job market relevance
   - Skills this unlocks

8. NAVIGATION OPTIONS
   - Clear next steps / branch options

Output the final lesson structure as JSON:
{
  "lesson_id": "",
  "title": "",
  "header": {
    "hook": "",
    "objectives": [],
    "estimated_minutes": 0,
    "prerequisites": []
  },
  "sections": [
    {
      "type": "motivation|content|video_callout|hands_on|misconceptions|career|navigation",
      "title": "",
      "content_markdown": "",
      "embedded_elements": [
        {
          "type": "code|video|tool_doc|terminology",
          "reference_id": "",
          "placement_note": ""
        }
      ]
    }
  ],
  "video_insertions": [
    {
      "video_id": "",
      "insert_after_section": 0,
      "intro_text": "",
      "focus_points": []
    }
  ],
  "quality_notes": {
    "content_gaps": [],
    "freshness_warnings": [],
    "confidence_level": "high|medium|low"
  }
}
```

---

## API Integration Specifications

### YouTube Data API v3 Integration

```javascript
// YouTube Search Configuration
const YOUTUBE_SEARCH_CONFIG = {
  baseUrl: 'https://www.googleapis.com/youtube/v3/search',
  defaultParams: {
    part: 'snippet',
    type: 'video',
    videoEmbeddable: true,
    relevanceLanguage: 'en',
    safeSearch: 'strict',
    maxResults: 10
  }
};

// Search for technique videos (short tutorials)
const searchTechniqueVideos = async (query, lessonContext) => {
  const params = {
    ...YOUTUBE_SEARCH_CONFIG.defaultParams,
    q: query,
    videoDuration: 'medium', // 4-20 minutes
    order: 'relevance'
  };
  // Execute search and filter results
};

// Search for project videos (full tutorials)
const searchProjectVideos = async (query, lessonContext) => {
  const params = {
    ...YOUTUBE_SEARCH_CONFIG.defaultParams,
    q: query,
    videoDuration: 'long', // > 20 minutes
    order: 'viewCount' // Prioritize popular content
  };
  // Execute search and filter results
};

// Video quality scoring function
const scoreVideo = (video, criteria) => {
  let score = 0;
  
  // View count factor (log scale)
  score += Math.log10(video.statistics.viewCount) * 10;
  
  // Recency factor
  const ageMonths = monthsSince(video.snippet.publishedAt);
  if (ageMonths < criteria.maxAgeMonths) {
    score += (criteria.maxAgeMonths - ageMonths) * 2;
  }
  
  // Channel authority (subscriber count, video count)
  score += Math.log10(video.channel.subscriberCount) * 5;
  
  // Title relevance (keyword matching)
  score += calculateTitleRelevance(video.snippet.title, criteria.mustHaveConcepts);
  
  // Negative signals
  if (hasNegativeSignals(video, criteria.titleNegativeSignals)) {
    score -= 50;
  }
  
  return score;
};
```

### Content Cache Strategy

```javascript
const CACHE_TTL = {
  core_content: null,           // Never expires (foundational knowledge)
  tool_documentation: 30,       // 30 days
  job_market: 90,               // 90 days  
  market_stats: 60,             // 60 days
  youtube_technique: 30,        // 30 days
  youtube_project: 60           // 60 days (projects age slower)
};

const shouldRefreshContent = (contentType, lastFetchedAt) => {
  const ttl = CACHE_TTL[contentType];
  if (ttl === null) return false;
  
  const ageInDays = daysSince(lastFetchedAt);
  return ageInDays > ttl;
};
```

---

## Content Generation Flow

### Sequence Diagram: New Lesson Request

```
User                Platform              Cache           LLM            WebSearch        YouTube
  |                    |                    |              |                 |              |
  |--Navigate to------>|                    |              |                 |              |
  |  lesson            |                    |              |                 |              |
  |                    |--Check cache------>|              |                 |              |
  |                    |<--Cache miss-------|              |                 |              |
  |                    |                    |              |                 |              |
  |                    |--Route request-----|------------->|                 |              |
  |                    |   (PROMPT 7)       |              |                 |              |
  |                    |<--Source plan------|--------------|                 |              |
  |                    |                    |              |                 |              |
  |                    |==================PARALLEL PHASE 1==================|              |
  |                    |--Core content------|------------->|                 |              |
  |                    |   (PROMPT 2)       |              |                 |              |
  |                    |--YouTube queries---|--------------|-----------------|------------->|
  |                    |   (PROMPT 6)       |              |                 |              |
  |                    |                    |              |                 |              |
  |                    |<--Core JSON--------|--------------|                 |              |
  |                    |<--Video results----|--------------|-----------------|--------------|
  |                    |                    |              |                 |              |
  |                    |==================PARALLEL PHASE 2==================|              |
  |                    |--Tool docs---------|--------------|---------------->|              |
  |                    |   (PROMPT 3)       |              |                 |              |
  |                    |--Job market--------|--------------|---------------->|              |
  |                    |   (PROMPT 4)       |              |                 |              |
  |                    |                    |              |                 |              |
  |                    |<--Docs JSON--------|--------------|-----------------|              |
  |                    |<--Jobs JSON--------|--------------|-----------------|              |
  |                    |                    |              |                 |              |
  |                    |--Synthesize--------|------------->|                 |              |
  |                    |   (PROMPT 9)       |              |                 |              |
  |                    |<--Unified lesson---|--------------|                 |              |
  |                    |                    |              |                 |              |
  |                    |--Store in cache--->|              |                 |              |
  |                    |                    |              |                 |              |
  |<--Render lesson----|                    |              |                 |              |
  |                    |                    |              |                 |              |
```

---

## Appendix: Example Generated Content

### Example: React Hooks Lesson (Abbreviated)

```json
{
  "lesson": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Understanding React Hooks",
    "course_id": "react-fundamentals-2024",
    
    "content": {
      "core_explanation": {
        "markdown": "## Why Hooks Exist\n\nBefore 2019, React developers faced a frustrating limitation..."
      },
      "analogies": [
        {
          "target_audience": "visual_learners",
          "analogy_text": "Think of a React component as a musician. Before Hooks, functional components were like musicians who could only play one note—they received props and rendered, nothing more. Class components were full orchestras with access to state, lifecycle methods, and complex behaviors. Hooks gave functional components a complete instrument panel..."
        }
      ],
      "terminology": [
        {
          "term": "useState",
          "definition": "A Hook that adds state management to functional components, returning a stateful value and a function to update it.",
          "usage_example": "const [count, setCount] = useState(0);"
        }
      ],
      "code_examples": [
        {
          "type": "minimal",
          "language": "javascript",
          "title": "Basic Counter with useState",
          "code": "function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}"
        }
      ]
    },
    
    "current_info": {
      "tool_docs": [
        {
          "tool_name": "React",
          "version": "18.2.0",
          "key_features": ["Concurrent rendering", "Automatic batching", "Transitions API"]
        }
      ],
      "job_market": {
        "demand_level": "very_high",
        "average_salary_range": "$90,000 - $160,000",
        "related_job_titles": ["Frontend Developer", "React Developer", "Full Stack Engineer"]
      }
    },
    
    "youtube_resources": {
      "technique_videos": [
        {
          "video_id": "O6P86uwfdR0",
          "title": "useState Hook Explained in 10 Minutes",
          "channel_name": "Web Dev Simplified",
          "duration_seconds": 612,
          "relevance_score": 0.94
        }
      ],
      "project_videos": [
        {
          "video_id": "example123",
          "title": "Build a Task Manager with React Hooks",
          "duration_seconds": 3840,
          "technologies_used": ["React", "useState", "useEffect", "LocalStorage"]
        }
      ]
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up database with schemas above
- [ ] Implement content routing logic (PROMPT 7)
- [ ] Build LLM integration for core content (PROMPT 2)
- [ ] Create caching layer with TTL support

### Phase 2: Web Search Integration  
- [ ] Implement tool docs search (PROMPT 3)
- [ ] Implement job market search (PROMPT 4)
- [ ] Implement market stats search (PROMPT 5)
- [ ] Build refresh scheduling system

### Phase 3: YouTube Integration
- [ ] Set up YouTube Data API access
- [ ] Implement video search logic (PROMPT 6)
- [ ] Build video scoring algorithm
- [ ] Create video metadata caching

### Phase 4: Content Synthesis
- [ ] Implement content merger (PROMPT 9)
- [ ] Build lesson rendering system
- [ ] Create branch point handling (PROMPT 8)

### Phase 5: Course Generation
- [ ] Implement course structure generation (PROMPT 1)
- [ ] Build path tracking system
- [ ] Create analytics for path popularity

---

*Document Version: 1.0*
*Last Updated: Generated on request*