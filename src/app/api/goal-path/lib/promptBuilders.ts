/**
 * Goal Path Prompt Builders
 *
 * Prompt construction functions for each Goal Path variant.
 * These builders create structured prompts for the Claude API
 * to generate personalized learning paths.
 */

import type {
    LiveFormRequest,
    ChatRequest,
    EnhancedRequest,
    OracleRequest,
    ChatMessage,
    FocusArea,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const FOCUS_AREA_DETAILS: Record<FocusArea, { name: string; skills: string[] }> = {
    frontend: {
        name: "Frontend Development",
        skills: ["HTML", "CSS", "JavaScript", "React", "Vue", "TypeScript", "Responsive Design"],
    },
    backend: {
        name: "Backend Development",
        skills: ["Node.js", "Python", "APIs", "Databases", "Authentication", "Server Architecture"],
    },
    devops: {
        name: "DevOps & Infrastructure",
        skills: ["Docker", "Kubernetes", "CI/CD", "Cloud Services", "Monitoring", "Infrastructure as Code"],
    },
    data: {
        name: "Data Engineering",
        skills: ["SQL", "Data Pipelines", "ETL", "Data Warehousing", "Analytics", "Big Data"],
    },
    security: {
        name: "Security",
        skills: ["OWASP", "Authentication", "Encryption", "Penetration Testing", "Compliance"],
    },
    mobile: {
        name: "Mobile Development",
        skills: ["React Native", "Flutter", "iOS", "Android", "Mobile UI/UX", "App Store Deployment"],
    },
};

// ============================================================================
// LIVE FORM PROMPT BUILDER
// ============================================================================

/**
 * Builds a prompt for the Live Form variant.
 * Single comprehensive path generation based on user inputs.
 */
export function buildLiveFormPrompt(request: LiveFormRequest): string {
    const focusDetails = request.focus
        .map(f => `- ${FOCUS_AREA_DETAILS[f].name}: ${FOCUS_AREA_DETAILS[f].skills.join(", ")}`)
        .join("\n");

    const totalAvailableHours = request.timeCommitment * 4 * request.deadline;

    return `You are an expert learning path designer for software developers. Create a comprehensive, personalized learning path based on the following user profile.

## User Profile

**Goal:** ${request.goal}
**Time Available:** ${request.timeCommitment} hours per week
**Target Deadline:** ${request.deadline} months
**Total Learning Hours Available:** ${totalAvailableHours} hours
**Preferred Learning Style:** ${request.learningStyle || "mixed"}

**Focus Areas:**
${focusDetails}

## Task

Generate a detailed learning path that:
1. Is achievable within the time constraints
2. Prioritizes skills based on the user's goal
3. Builds knowledge progressively (foundational → advanced)
4. Includes practical projects for hands-on learning
5. Considers the latest industry trends and best practices

## Response Format

Respond with a valid JSON object matching this structure:
{
  "pathId": "unique-id-string",
  "goal": "summarized goal",
  "totalHours": number,
  "estimatedWeeks": number,
  "moduleCount": number,
  "topicCount": number,
  "modules": [
    {
      "title": "Module Title",
      "description": "Brief description",
      "topics": ["topic1", "topic2"],
      "estimatedHours": number,
      "sequence": number,
      "skills": ["skill1", "skill2"],
      "resources": [
        {"type": "article|video|practice|course", "title": "Resource name"}
      ]
    }
  ],
  "hoursPerFocusArea": {"frontend": number, "backend": number, ...},
  "isJobReady": boolean,
  "skillLevel": "beginner|intermediate|advanced|expert",
  "recommendations": ["recommendation1", "recommendation2"]
}

Ensure:
- Total hours across modules equals totalHours
- Modules are properly sequenced
- Each module builds on previous knowledge
- Include at least one practical project per focus area
- Recommendations are actionable and specific`;
}

// ============================================================================
// AI CHAT PROMPT BUILDER
// ============================================================================

/**
 * Builds a prompt for the AI Chat variant.
 * Multi-turn conversation management with context awareness.
 */
export function buildChatPrompt(request: ChatRequest): string {
    const conversationHistory = request.messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

    const collectedDataSummary = Object.entries(request.collectedData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("\n");

    const stageInstructions = getChatStageInstructions(request.stage, request.collectedData as Record<string, unknown>);

    return `You are a friendly AI learning assistant helping users define their personalized learning path through conversation. Maintain a warm, encouraging tone while gathering necessary information.

## Current Conversation Stage: ${request.stage}

## Data Collected So Far:
${collectedDataSummary || "None yet"}

## Conversation History:
${conversationHistory}

## Your Task for This Stage:
${stageInstructions}

## Response Format

Respond with a valid JSON object:
{
  "message": "Your conversational response to the user",
  "options": ["Option 1", "Option 2", "Option 3"] or null if open-ended,
  "stage": "current_or_next_stage",
  "collectedData": {
    ...updated collected data...
  },
  "generatedPath": null or {path object if stage is presenting_path},
  "isComplete": boolean
}

Guidelines:
- Keep responses conversational and encouraging
- Use the user's name or goal to personalize responses
- When offering options, provide 3-5 relevant choices
- Progress to the next stage when you have the needed information
- If the user's response is unclear, ask for clarification within the same stage
- When presenting the path, celebrate their commitment and provide clear next steps`;
}

/**
 * Get stage-specific instructions for chat prompt
 */
function getChatStageInstructions(stage: string, collectedData: Record<string, unknown>): string {
    const instructions: Record<string, string> = {
        greeting: `Welcome the user warmly and ask about their ultimate career goal. Provide 4 common goal options plus an open-ended option.`,

        goal_collection: `The user has provided their goal. Acknowledge it enthusiastically and ask about their weekly time commitment. Offer options like "5-10 hours", "10-20 hours", "20-30 hours", "30+ hours".`,

        time_collection: `The user has specified their time commitment (${collectedData.timeCommitment || "unknown"} hours). Ask about their current skill level. Offer options: "Complete Beginner", "Some Basics", "Intermediate", "Advanced".`,

        skill_level_collection: `The user has indicated their skill level. Ask about their target timeline/deadline. Offer options: "3 months", "6 months", "12 months", "No specific deadline".`,

        deadline_collection: `The user has provided their deadline preference. Thank them for all the information and transition to generating their personalized path. Set stage to "generating".`,

        generating: `Generate the learning path based on collected data and present it. Create an engaging summary of their personalized path with key metrics (weeks, lessons, projects). Set stage to "presenting_path".`,

        presenting_path: `The path has been presented. Ask if they'd like to make any adjustments or if they're ready to start. Offer refinement options or confirm they're ready to begin.`,

        refinement: `Handle the user's refinement request. Adjust the path based on their feedback and present the updated version.`,
    };

    return instructions[stage] || "Continue the conversation naturally based on context.";
}

// ============================================================================
// ENHANCED PROMPT BUILDER
// ============================================================================

/**
 * Builds a prompt for the Enhanced/Wizard variant.
 * Full plan with detailed modules, milestones, and recommendations.
 */
export function buildEnhancedPrompt(request: EnhancedRequest): string {
    const estimatedWeeks = request.deadline ? request.deadline * 4 : 24;
    const totalHours = request.timeCommitment * estimatedWeeks;

    return `You are a senior technical curriculum designer creating a comprehensive learning path. Design a detailed, milestone-driven program that maximizes learning outcomes.

## Learner Profile

**Goal:** ${request.goal}
**Current Level:** ${request.currentLevel || "beginner"}
**Learning Style:** ${request.learningStyle}
**Weekly Hours:** ${request.timeCommitment}
**Timeline:** ${request.deadline ? `${request.deadline} months` : "Flexible"}
**Total Available Hours:** ${totalHours}
**Interests:** ${request.interests?.join(", ") || "General full-stack development"}

## Design Requirements

1. **Progressive Skill Building**
   - Start from the learner's current level
   - Build complexity gradually
   - Ensure each module provides foundation for the next

2. **Milestone-Driven Progress**
   - Create checkpoints every 2-4 weeks
   - Each milestone should have a tangible deliverable
   - Include job match improvement estimates

3. **Learning Style Optimization**
   - ${getLearningStyleGuidance(request.learningStyle)}

4. **Practical Application**
   - Include hands-on projects
   - Real-world scenarios and case studies
   - Portfolio-building opportunities

## Response Format

Respond with a valid JSON object:
{
  "pathId": "unique-id",
  "goal": "refined goal statement",
  "modules": [
    {
      "title": "Module Title",
      "description": "Detailed description",
      "topics": ["topic1", "topic2", "topic3"],
      "estimatedHours": number,
      "sequence": number,
      "skills": ["skill1", "skill2"],
      "resources": [
        {"type": "article|video|practice|course", "title": "Resource Title"}
      ]
    }
  ],
  "milestones": [
    {
      "id": "milestone-1",
      "title": "Milestone Title",
      "targetWeek": number,
      "skillsAcquired": ["skill1", "skill2"],
      "jobMatchIncrease": number (percentage),
      "deliverable": "Description of what they'll have built/achieved"
    }
  ],
  "estimatedWeeks": number,
  "lessonCount": number,
  "projectCount": number,
  "skillProgression": [
    {
      "week": number,
      "skills": ["skills unlocked by this week"],
      "level": "beginner|intermediate|advanced|expert"
    }
  ],
  "tips": ["personalized tip 1", "personalized tip 2"],
  "successProbability": number (0-100)
}

Create a path that is:
- Realistic given time constraints
- Engaging with variety in content types
- Focused on practical, marketable skills
- Designed for the specific learning style`;
}

/**
 * Get learning style-specific guidance
 */
function getLearningStyleGuidance(style: string): string {
    const guidance: Record<string, string> = {
        video: "Prioritize video tutorials, recorded lectures, and visual demonstrations. Include timestamps and video summaries.",
        text: "Focus on documentation, articles, and written tutorials. Include reading lists and reference materials.",
        project: "Structure around hands-on projects. Each module should include practical exercises with increasing complexity.",
        interactive: "Include interactive exercises, coding challenges, quizzes, and gamified elements.",
    };

    return guidance[style] || guidance.project;
}

// ============================================================================
// ORACLE PROMPT BUILDER
// ============================================================================

/**
 * Builds a prompt for the Career Oracle variant.
 * Predictions, learning path, and job matching based on market intelligence.
 */
export function buildOraclePrompt(request: OracleRequest): string {
    const skillsList = request.currentSkills
        .map(s => `- ${s.name} (proficiency: ${s.proficiency}/5${s.yearsOfExperience ? `, ${s.yearsOfExperience} years` : ""})`)
        .join("\n");

    const baseContext = `## User Profile

**Current Skills:**
${skillsList}

**Target Role:** ${request.targetRole}
**Target Industry:** ${request.targetSector || "Technology (general)"}
**Weekly Learning Hours:** ${request.weeklyHours}
**Learning Style:** ${request.learningStyle}
**Risk Tolerance:** ${request.riskTolerance}
**Remote Preference:** ${request.remotePreference}
**Prediction Horizon:** ${request.horizon || "12m"}
${request.targetSalary ? `**Target Salary:** $${request.targetSalary.toLocaleString()}` : ""}
${request.location ? `**Location:** ${request.location}` : ""}`;

    switch (request.action) {
        case "predictions":
            return buildOraclePredictionsPrompt(baseContext, request);
        case "path":
            return buildOraclePathPrompt(baseContext, request);
        case "jobs":
            return buildOracleJobsPrompt(baseContext, request);
        default:
            return buildOraclePredictionsPrompt(baseContext, request);
    }
}

/**
 * Build predictions-focused oracle prompt
 */
function buildOraclePredictionsPrompt(context: string, request: OracleRequest): string {
    return `You are an AI career intelligence analyst with access to current market data and trends. Analyze skill demand, industry trends, and provide actionable insights.

${context}

## Task: Generate Market Intelligence Report

Analyze the market for the user's target role and provide:
1. Skill demand predictions for relevant skills
2. Industry trend analysis for their target sector
3. Recommendations for skills to learn based on market trajectory

## Response Format

Respond with a valid JSON object:
{
  "action": "predictions",
  "skillDemand": [
    {
      "skillName": "Skill Name",
      "currentDemand": number (0-100),
      "predictedDemand": number (0-100),
      "trend": "rising|stable|declining|emerging|saturating",
      "changePercent": number,
      "confidence": "low|medium|high|very_high",
      "saturationLevel": number (0-100),
      "urgency": "low|moderate|high|critical",
      "reasoning": "Brief explanation of the prediction"
    }
  ],
  "industryTrends": [
    {
      "sector": "${request.targetSector || "tech_startups"}",
      "name": "Display Name",
      "growthRate": number (annual percentage),
      "topSkills": ["skill1", "skill2"],
      "jobGrowth": "rising|stable|declining|emerging|saturating",
      "remoteAvailability": number (0-100),
      "entryBarrier": "low|medium|high"
    }
  ],
  "recommendedSkills": ["skill1", "skill2", "skill3"]
}

Base predictions on:
- Current job market trends
- Technology adoption curves
- Industry growth patterns
- AI and automation impact
- Remote work evolution`;
}

/**
 * Build path-focused oracle prompt
 */
function buildOraclePathPrompt(context: string, request: OracleRequest): string {
    return `You are an AI career strategist designing optimal learning paths based on market intelligence. Create a path that maximizes career outcomes while managing risk.

${context}

## Task: Generate Optimized Learning Path

Design a learning path that:
1. Addresses skill gaps for the target role
2. Optimizes for market timing (learn skills at the right time)
3. Balances risk vs. reward
4. Includes milestones with job match improvements

## Response Format

Respond with a valid JSON object:
{
  "action": "path",
  "learningPath": {
    "id": "path-unique-id",
    "targetRole": "${request.targetRole}",
    "estimatedWeeks": number,
    "modules": [
      {
        "title": "Module Title",
        "description": "Description",
        "topics": ["topic1", "topic2"],
        "estimatedHours": number,
        "sequence": number,
        "skills": ["skill1", "skill2"],
        "resources": [{"type": "article|video|practice|course", "title": "Resource"}]
      }
    ],
    "milestones": [
      {
        "id": "milestone-id",
        "title": "Milestone Title",
        "targetWeek": number,
        "skillsAcquired": ["skill1"],
        "jobMatchIncrease": number,
        "deliverable": "What they'll complete"
      }
    ],
    "confidence": "low|medium|high|very_high"
  },
  "marketTiming": {
    "recommendation": "start_now|wait|accelerate|pivot",
    "reasoning": "Detailed explanation",
    "keyFactors": ["factor1", "factor2"],
    "warningSignals": ["signal1"],
    "opportunitySignals": ["signal1"]
  },
  "riskAssessment": {
    "overallRisk": "low|moderate|high",
    "techObsolescenceRisk": "low|moderate|high",
    "marketSaturationRisk": "low|moderate|high",
    "automationRisk": "low|moderate|high",
    "mitigationStrategies": ["strategy1", "strategy2"],
    "hedgeSkills": ["skill1", "skill2"]
  },
  "alternativePaths": [
    {
      "name": "Alternative Path Name",
      "description": "Brief description",
      "differentiator": "How it differs",
      "riskComparison": "lower|similar|higher",
      "timeComparison": "faster|similar|slower"
    }
  ]
}

Consider:
- User's risk tolerance (${request.riskTolerance})
- Time investment capacity (${request.weeklyHours}h/week)
- Current skill foundation
- Market window for skills`;
}

/**
 * Build jobs-focused oracle prompt
 */
function buildOracleJobsPrompt(context: string, request: OracleRequest): string {
    return `You are an AI job market analyst matching candidates with opportunities. Analyze the user's profile against current market opportunities.

${context}

## Task: Generate Job Market Analysis

Identify:
1. Jobs matching the user's current and target skills
2. Skill gaps preventing higher matches
3. Time to qualification estimates
4. Market opportunities summary

## Response Format

Respond with a valid JSON object:
{
  "action": "jobs",
  "matchingJobs": [
    {
      "id": "job-id",
      "company": "Company Name",
      "title": "Job Title",
      "matchScore": number (0-100),
      "skillGaps": ["missing skill 1", "missing skill 2"],
      "estimatedTimeToQualify": number (weeks),
      "salaryRange": {
        "min": number,
        "max": number,
        "currency": "USD"
      },
      "remote": "no|hybrid|full",
      "location": "City, Country or Remote"
    }
  ],
  "topSkillGaps": ["skill1", "skill2", "skill3"],
  "jobMarketSummary": "Brief summary of job market outlook for this role"
}

Generate realistic job opportunities based on:
- User's current skills and gaps
- Target role requirements
- Industry standards for the sector
- Remote work preferences
- Salary expectations if specified`;
}

// ============================================================================
// SYSTEM MESSAGE BUILDER
// ============================================================================

/**
 * Builds the system message for API calls
 */
export function buildSystemMessage(variant: "live-form" | "ai-chat" | "enhanced" | "oracle"): string {
    const baseInstructions = `You are an AI learning path designer. Always respond with valid JSON matching the specified format. Do not include markdown code blocks or any text outside the JSON object.`;

    const variantInstructions: Record<string, string> = {
        "live-form": `${baseInstructions} Focus on practical, achievable learning paths with realistic time estimates.`,
        "ai-chat": `${baseInstructions} Maintain a conversational, encouraging tone while systematically gathering information.`,
        enhanced: `${baseInstructions} Create comprehensive, milestone-driven paths with detailed skill progressions.`,
        oracle: `${baseInstructions} Provide data-driven insights, market analysis, and strategic career recommendations.`,
    };

    return variantInstructions[variant] || baseInstructions;
}
