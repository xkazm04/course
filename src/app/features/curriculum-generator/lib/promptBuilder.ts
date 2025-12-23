/**
 * Prompt Builder for AI Curriculum Generation
 *
 * Builds structured prompts for generating curriculum content
 * based on user profile and module information.
 */

import type {
    CurriculumGenerationRequest,
    DifficultyLevel,
} from "./types";

/**
 * System message for curriculum generation
 */
export const CURRICULUM_SYSTEM_MESSAGE = `You are an expert curriculum designer and software engineering educator. Your role is to create highly personalized, practical learning content that helps developers achieve their career goals.

## Content Philosophy
- Create content that is immediately applicable and actionable
- Use real-world examples and industry-relevant scenarios
- Progress from foundational concepts to advanced applications
- Include common pitfalls and best practices
- Make learning engaging through variety in content types

## Quality Standards
- Every lesson should have clear, measurable learning objectives
- Code examples must be correct, well-commented, and follow best practices
- Exercises should progressively build skills with appropriate challenge levels
- Quizzes should test understanding, not memorization
- Projects should be portfolio-worthy and demonstrate practical skills

## Personalization Guidelines
- Adapt language complexity to the learner's experience level
- Reference skills the learner already has when introducing new concepts
- Align examples with the target role and industry
- Respect the learner's time constraints and learning style preferences

IMPORTANT: Always respond with valid JSON matching the exact structure requested. Do not include markdown code blocks or any text outside the JSON.`;

/**
 * Build prompt for generating lesson outlines
 */
export function buildLessonPrompt(request: CurriculumGenerationRequest): string {
    const { module, userProfile, context } = request;

    return `Generate a comprehensive lesson outline for the following module:

## Module Information
- Title: ${module.title}
- Skills to Cover: ${module.skills.join(", ")}
- Target Duration: ${module.estimatedHours} hours
- Sequence: Module ${module.sequence} in the learning path

## Learner Profile
- Current Skills: ${userProfile.currentSkills.join(", ")}
- Target Role: ${userProfile.targetRole}
- Target Industry: ${userProfile.targetSector || "General Tech"}
- Learning Style: ${userProfile.learningStyle}
- Current Level: ${userProfile.currentLevel}
- Weekly Study Time: ${userProfile.weeklyHours} hours

${context?.previousModules?.length ? `## Prior Learning\nCompleted modules: ${context.previousModules.join(", ")}` : ""}
${context?.userPreferences?.length ? `## User Preferences\n${context.userPreferences.join("\n")}` : ""}
${context?.focusAreas?.length ? `## Focus Areas\n${context.focusAreas.join(", ")}` : ""}

Generate 3-5 lesson outlines that cover all the skills in this module. Each lesson should be approximately ${Math.floor((module.estimatedHours * 60) / 4)} minutes.

Respond with a JSON object matching this structure:
{
  "lessons": [
    {
      "id": "lesson-1",
      "title": "string",
      "summary": "string (2-3 sentences)",
      "learningObjectives": ["string (start with action verb)", ...],
      "sections": [
        {
          "id": "section-1",
          "title": "string",
          "type": "theory|example|practice|summary",
          "content": "string (markdown formatted, 200-500 words)",
          "codeSnippets": [
            {
              "id": "snippet-1",
              "language": "string",
              "code": "string",
              "explanations": {"1": "explanation for line 1", ...},
              "caption": "string"
            }
          ],
          "tips": ["string", ...],
          "commonMistakes": ["string", ...]
        }
      ],
      "keyConcepts": [
        {
          "name": "string",
          "definition": "string (1-2 sentences)",
          "relatedConcepts": ["string", ...],
          "analogy": "string (real-world comparison)"
        }
      ],
      "estimatedMinutes": number,
      "difficulty": "${userProfile.currentLevel}",
      "prerequisites": ["string", ...],
      "nextLessons": ["string", ...]
    }
  ]
}`;
}

/**
 * Build prompt for generating code exercises
 */
export function buildExercisePrompt(request: CurriculumGenerationRequest, lessonContext?: string): string {
    const { module, userProfile } = request;

    const exerciseTypes = getExerciseTypesForLevel(userProfile.currentLevel);

    return `Generate practical code exercises for the following module:

## Module Information
- Title: ${module.title}
- Skills: ${module.skills.join(", ")}

## Learner Profile
- Current Level: ${userProfile.currentLevel}
- Target Role: ${userProfile.targetRole}
- Learning Style: ${userProfile.learningStyle}

${lessonContext ? `## Lesson Context\n${lessonContext}` : ""}

## Exercise Requirements
- Create 4-6 exercises of varying difficulty
- Use exercise types appropriate for ${userProfile.currentLevel} level: ${exerciseTypes.join(", ")}
- Each exercise should take 10-30 minutes
- Include progressive hints (3-4 hints per exercise)
- Test cases should cover edge cases

Respond with a JSON object matching this structure:
{
  "exercises": [
    {
      "id": "exercise-1",
      "title": "string",
      "description": "string (clear problem statement, 2-4 sentences)",
      "language": "typescript|javascript|python",
      "difficulty": "beginner|intermediate|advanced|expert",
      "type": "fill_in_blanks|fix_bug|implement_function|refactor|debug|extend_feature|from_scratch",
      "starterCode": "string (code template with comments for guidance)",
      "solutionCode": "string (complete working solution)",
      "testCases": [
        {
          "id": "test-1",
          "description": "string",
          "input": "any (JSON serializable)",
          "expectedOutput": "any (JSON serializable)",
          "hidden": boolean
        }
      ],
      "hints": ["string (progressively more helpful)", ...],
      "concepts": ["string", ...],
      "estimatedMinutes": number,
      "commonErrors": [
        {
          "pattern": "string (code pattern that indicates error)",
          "explanation": "string",
          "suggestion": "string"
        }
      ]
    }
  ]
}`;
}

/**
 * Build prompt for generating quizzes
 */
export function buildQuizPrompt(request: CurriculumGenerationRequest, lessonContext?: string): string {
    const { module, userProfile } = request;

    return `Generate a comprehensive quiz for the following module:

## Module Information
- Title: ${module.title}
- Skills Tested: ${module.skills.join(", ")}

## Learner Profile
- Current Level: ${userProfile.currentLevel}
- Target Role: ${userProfile.targetRole}

${lessonContext ? `## Lesson Context\n${lessonContext}` : ""}

## Quiz Requirements
- Create 10-15 questions of varying types
- Mix question types: multiple choice, multi-select, true/false, code output, fill in the blank
- Include code snippets where relevant
- Test understanding, not memorization
- Provide detailed explanations for all answers

Respond with a JSON object matching this structure:
{
  "quiz": {
    "id": "quiz-1",
    "title": "string",
    "description": "string",
    "questions": [
      {
        "id": "q-1",
        "type": "multiple_choice|multi_select|true_false|code_output|fill_blank|ordering",
        "question": "string",
        "codeContext": "string (optional code snippet for context)",
        "options": [
          {
            "id": "opt-1",
            "text": "string",
            "code": "string (optional)",
            "whyWrong": "string (for incorrect options only)"
          }
        ],
        "correctAnswer": "string|string[]|boolean (depends on type)",
        "explanation": "string (detailed explanation of why answer is correct)",
        "points": number,
        "hints": ["string", ...],
        "concept": "string (main concept being tested)"
      }
    ],
    "passingScore": 70,
    "timeLimit": 0,
    "topics": ["string", ...],
    "difficulty": "${userProfile.currentLevel}",
    "shuffleQuestions": true,
    "showExplanationsImmediately": false
  }
}`;
}

/**
 * Build prompt for generating project specifications
 */
export function buildProjectPrompt(request: CurriculumGenerationRequest): string {
    const { module, userProfile } = request;

    return `Generate a portfolio-worthy project specification for the following module:

## Module Information
- Title: ${module.title}
- Skills Applied: ${module.skills.join(", ")}
- Available Time: ${module.estimatedHours} hours (project should be 40-60% of this)

## Learner Profile
- Current Skills: ${userProfile.currentSkills.join(", ")}
- Target Role: ${userProfile.targetRole}
- Target Industry: ${userProfile.targetSector || "General Tech"}
- Current Level: ${userProfile.currentLevel}

## Project Requirements
- Should be completable in ${Math.floor(module.estimatedHours * 0.5)} hours
- Must demonstrate practical application of module skills
- Should be relevant to ${userProfile.targetRole} role
- Include clear milestones and evaluation criteria
- Provide portfolio-ready description

Respond with a JSON object matching this structure:
{
  "project": {
    "id": "project-1",
    "title": "string (catchy, professional)",
    "overview": "string (1-2 sentences elevator pitch)",
    "description": "string (detailed description, 3-5 paragraphs)",
    "goals": ["string (what learner will achieve)", ...],
    "technologies": ["string", ...],
    "difficulty": "${userProfile.currentLevel}",
    "estimatedHours": number,
    "milestones": [
      {
        "id": "milestone-1",
        "title": "string",
        "description": "string",
        "tasks": ["string (specific actionable task)", ...],
        "skillsPracticed": ["string", ...],
        "estimatedHours": number,
        "order": number
      }
    ],
    "deliverables": [
      {
        "id": "deliverable-1",
        "name": "string",
        "description": "string",
        "type": "code|documentation|presentation|demo|design",
        "requirements": ["string", ...]
      }
    ],
    "starterResources": [
      {
        "name": "string",
        "type": "template|api|dataset|documentation|tutorial",
        "url": "string (optional)",
        "description": "string"
      }
    ],
    "evaluationCriteria": [
      {
        "name": "string",
        "description": "string",
        "weight": number (1-10),
        "rubric": {
          "excellent": "string",
          "good": "string",
          "satisfactory": "string",
          "needsImprovement": "string"
        }
      }
    ],
    "stretchGoals": ["string (optional advanced features)", ...],
    "industryRelevance": "string (how this applies to real jobs)",
    "portfolioDescription": "string (how to present this in portfolio/resume)"
  }
}`;
}

/**
 * Get appropriate exercise types for skill level
 */
function getExerciseTypesForLevel(level: DifficultyLevel): string[] {
    switch (level) {
        case "beginner":
            return ["fill_in_blanks", "fix_bug", "implement_function"];
        case "intermediate":
            return ["implement_function", "fix_bug", "refactor", "debug"];
        case "advanced":
            return ["implement_function", "refactor", "extend_feature", "from_scratch"];
        case "expert":
            return ["from_scratch", "extend_feature", "refactor"];
        default:
            return ["fill_in_blanks", "implement_function"];
    }
}

/**
 * Build a combined prompt for full curriculum generation
 */
export function buildFullCurriculumPrompt(request: CurriculumGenerationRequest): string {
    const { module, userProfile, generateOptions, context } = request;

    const sections: string[] = [];

    sections.push(`Generate comprehensive curriculum content for the following module:

## Module Information
- ID: ${module.id}
- Title: ${module.title}
- Skills: ${module.skills.join(", ")}
- Duration: ${module.estimatedHours} hours
- Sequence: Module ${module.sequence}

## Learner Profile
- Current Skills: ${userProfile.currentSkills.join(", ")}
- Target Role: ${userProfile.targetRole}
- Industry: ${userProfile.targetSector || "General Tech"}
- Learning Style: ${userProfile.learningStyle}
- Current Level: ${userProfile.currentLevel}
- Weekly Hours: ${userProfile.weeklyHours}

${context?.previousModules?.length ? `## Prior Learning: ${context.previousModules.join(", ")}` : ""}

## Content to Generate:`);

    if (generateOptions.lessons) {
        sections.push("- Lessons: 3-5 detailed lesson outlines with sections, code snippets, and concepts");
    }
    if (generateOptions.exercises) {
        sections.push("- Exercises: 4-6 code exercises with test cases and hints");
    }
    if (generateOptions.quizzes) {
        sections.push("- Quiz: 10-15 questions testing understanding");
    }
    if (generateOptions.projects) {
        sections.push("- Project: 1 portfolio-worthy project with milestones");
    }

    sections.push(`
Respond with a single JSON object containing all requested content. The structure should be:
{
  ${generateOptions.lessons ? '"lessons": [...] (array of LessonOutline objects),' : ""}
  ${generateOptions.exercises ? '"exercises": [...] (array of CodeExercise objects),' : ""}
  ${generateOptions.quizzes ? '"quiz": {...} (Quiz object),' : ""}
  ${generateOptions.projects ? '"project": {...} (ProjectSpecification object)' : ""}
}

Ensure all IDs are unique and all content is tailored to the learner's profile.`);

    return sections.join("\n");
}
