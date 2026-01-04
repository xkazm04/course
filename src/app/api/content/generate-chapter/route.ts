// ============================================================================
// Chapter Content Generation API
// POST /api/content/generate-chapter - Trigger chapter content generation
//
// NOTE: Chapter-level content is generated locally (via Anthropic SDK or fallback)
// The external content-generator API only supports domain/topic level content.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

interface GenerateChapterRequest {
    chapter_id: string;
    batch_id?: string;
    user_context?: {
        experience_level?: string;
        learning_style?: string;
        commitment?: string;
    };
}

// Helper to generate URL-friendly slug from title
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

interface GenerateChapterResponse {
    success: boolean;
    job_id: string;
    chapter_id: string;
    status: string;
    message?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Use admin client for dev/testing to bypass RLS
        const supabase = await createAdminClient();
        const authClient = await createClient();

        // Check authentication (use user if logged in, otherwise use service role for dev)
        const {
            data: { user },
        } = await authClient.auth.getUser();

        // For dev/testing, allow unauthenticated requests
        // In production, this should require authentication
        // userId must be a valid UUID or null for FK constraint
        const userId = user?.id || null;

        const body: GenerateChapterRequest = await request.json();
        const { chapter_id, batch_id, user_context } = body;

        if (!chapter_id) {
            return NextResponse.json(
                { error: "chapter_id is required" },
                { status: 400 }
            );
        }

        // Fetch chapter details
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select(`
                id,
                title,
                description,
                sort_order,
                course_id,
                courses (
                    id,
                    title,
                    description,
                    difficulty
                )
            `)
            .eq("id", chapter_id)
            .single() as {
                data: {
                    id: string;
                    title: string;
                    description: string | null;
                    sort_order: number;
                    course_id: string;
                    courses: { id: string; title: string; description: string | null; difficulty: string } | null;
                } | null;
                error: any;
            };

        if (chapterError || !chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Create chapter content job
        const { data: job, error: jobError } = await supabase
            .from("chapter_content_jobs")
            .insert({
                chapter_id,
                batch_id,
                requested_by_user_id: userId,
                chapter_context: {
                    chapter_title: chapter.title,
                    chapter_description: chapter.description,
                    sort_order: chapter.sort_order,
                    course_title: chapter.courses?.title,
                    course_description: chapter.courses?.description,
                    course_difficulty: chapter.courses?.difficulty,
                },
                user_context,
                status: "pending",
            } as any)
            .select("id")
            .single() as { data: { id: string } | null; error: any };

        if (jobError || !job) {
            console.error("Failed to create content job:", jobError);
            return NextResponse.json(
                { error: "Failed to create generation job" },
                { status: 500 }
            );
        }

        // Trigger async content generation
        // Will use external API if configured, otherwise falls back to local generation
        // Fire and forget - don't await
        triggerContentGeneration(job.id, chapter, user_context).catch(err => {
            console.error("Content generation error:", err);
        });

        const response: GenerateChapterResponse = {
            success: true,
            job_id: job.id,
            chapter_id,
            status: "pending",
            message: "Content generation queued",
        };

        return NextResponse.json(response, { status: 202 });
    } catch (error) {
        console.error("Generate chapter error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Async function to generate content
async function triggerContentGeneration(
    jobId: string,
    chapter: any,
    userContext?: any
) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Use service role for updating job status
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

    try {
        // Update job to processing
        await supabase
            .from("chapter_content_jobs")
            .update({
                status: "processing",
                started_at: new Date().toISOString(),
                progress_percent: 10,
                progress_message: "Generating content...",
            })
            .eq("id", jobId);

        let generatedContent: any;

        console.log(`[ContentGen] Generating content for: ${chapter.title}`);

        // Try Anthropic SDK first, fall back to local generation
        generatedContent = await generateContent(chapter, userContext);
        console.log(`[ContentGen] Content generated for: ${chapter.title} (model: ${generatedContent.metadata?.model_used})`);

        // Update job progress
        await supabase
            .from("chapter_content_jobs")
            .update({
                progress_percent: 80,
                progress_message: "Saving content...",
            })
            .eq("id", jobId);

        // Update job as completed (no content storage - jobs track status only)
        await supabase
            .from("chapter_content_jobs")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                progress_percent: 100,
                progress_message: "Content generated successfully",
                // NOTE: generated_content deprecated - content stored in sections table
                model_used: generatedContent.metadata?.model_used || "local_fallback",
                tokens_used: generatedContent.metadata?.tokens_used,
            })
            .eq("id", jobId);

        // Extract content for processing
        const content = generatedContent.content || generatedContent;

        // Update chapter with metadata only (sections are authoritative content store)
        await supabase
            .from("chapters")
            .update({
                // content_metadata stores non-section data only
                content_metadata: {
                    key_takeaways: content.key_takeaways || [],
                    video_variants: content.video_variants || [],
                    estimated_time_minutes: content.estimated_time_minutes || 30,
                    difficulty: content.difficulty || "intermediate",
                    introduction: content.introduction || "",
                },
                content_status: "ready",
                generated_at: new Date().toISOString(),
            })
            .eq("id", chapter.id);

        // Create section records from generated content
        // Note: content was extracted above before chapter update
        if (content.sections && Array.isArray(content.sections)) {
            // Delete existing sections first
            await supabase
                .from("sections")
                .delete()
                .eq("chapter_id", chapter.id);

            // Create new sections from generated content
            // Note: sections table uses content_markdown (renamed from description)
            // This is the authoritative source of section content
            const sectionInserts = content.sections.map((section: any, index: number) => ({
                chapter_id: chapter.id,
                slug: generateSlug(section.title || `section-${index + 1}`),
                title: section.title || `Section ${index + 1}`,
                content_markdown: section.content || section.description || "",
                content_type: section.type === "exercise" ? "exercise" : "lesson",
                sort_order: index + 1,
                estimated_minutes: section.estimated_minutes || 10,
                xp_reward: 50,
                is_preview: index === 0,
                is_ai_generated: true,
            }));

            const { error: sectionsError } = await supabase
                .from("sections")
                .insert(sectionInserts as any);

            if (sectionsError) {
                console.error("[ContentGen] Failed to create sections:", sectionsError);
            } else {
                console.log(`[ContentGen] Created ${sectionInserts.length} sections for: ${chapter.title}`);
            }
        }

        console.log(`[ContentGen] Completed: ${chapter.title}`);

    } catch (error) {
        console.error("[ContentGen] Content generation failed:", error);

        // Update job as failed
        await supabase
            .from("chapter_content_jobs")
            .update({
                status: "failed",
                completed_at: new Date().toISOString(),
                error_message: error instanceof Error ? error.message : "Unknown error",
            })
            .eq("id", jobId);

        // Update chapter status
        await supabase
            .from("chapters")
            .update({
                content_status: "failed",
            })
            .eq("id", chapter.id);
    }
}

// ============================================================================
// Expert Educator System Prompt
// ============================================================================

const EXPERT_EDUCATOR_PROMPT = `You are an expert technical educator with 15+ years of experience creating world-class online courses. Your content rivals the best instructors on Udemy, Coursera, and Pluralsight.

## Your Teaching Philosophy

1. **Start with WHY before HOW** - Always explain the motivation and real-world relevance before diving into implementation
2. **Use vivid analogies** - Connect abstract concepts to everyday experiences
3. **Show, don't just tell** - Include practical code examples for every concept
4. **Share production wisdom** - Add "Pro Tips" from real-world experience
5. **Prevent common mistakes** - Include "Common Pitfalls" to save learners frustration
6. **Progressive disclosure** - Build complexity gradually, one concept at a time

## Required Markdown Formatting

Use these specific formats that our renderer supports:

### Code Blocks
\`\`\`typescript
// Always include language identifier
const example = "well-formatted code";
\`\`\`

### Callouts (IMPORTANT - use exact syntax)
:::tip
Pro tips and best practices go here
:::

:::warning
Common pitfalls and things to avoid
:::

:::info
Additional context and background information
:::

### Other Formatting
- **Bold** for key terms on first use
- \`inline code\` for function names, variables, file paths
- Tables for comparisons
- Numbered lists for sequential steps
- Bullet lists for non-sequential items

## Content Quality Standards

- Each section should have 300+ words of substantive content
- Include 2-3 code examples per technical section
- At least one :::tip and one :::warning per section
- Use headers (##, ###) to organize content
- End sections with a brief transition to the next topic`;

// ============================================================================
// Anthropic Content Generation
// ============================================================================

async function generateWithAnthropic(chapter: any, userContext?: any): Promise<any | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.log("[ContentGen] No ANTHROPIC_API_KEY, skipping Anthropic generation");
        return null;
    }

    const chapterTitle = chapter.title || "Untitled Chapter";
    const courseTitle = chapter.courses?.title || "Course";
    const courseDescription = chapter.courses?.description || "";
    const difficulty = chapter.courses?.difficulty || userContext?.experience_level || "beginner";
    const chapterDescription = chapter.description || "";

    const userPrompt = `Create comprehensive educational content for this chapter:

## Chapter Details
- **Chapter Title**: ${chapterTitle}
- **Chapter Description**: ${chapterDescription || "Not provided"}
- **Course**: ${courseTitle}
- **Course Description**: ${courseDescription || "Not provided"}
- **Difficulty Level**: ${difficulty}
- **Learner Context**: ${userContext?.experience_level || "beginner"} level, prefers ${userContext?.learning_style || "balanced"} learning

## Required Output (JSON format)

Return a valid JSON object with this exact structure:

{
    "title": "${chapterTitle}",
    "introduction": "Engaging 2-3 sentence hook that explains WHY this topic matters",
    "sections": [
        {
            "title": "Section Title",
            "content": "Full markdown content with code blocks, callouts (:::tip, :::warning, :::info), lists, etc. Minimum 300 words.",
            "type": "text"
        }
    ],
    "key_takeaways": [
        "5-7 specific, actionable takeaways"
    ],
    "video_variants": [
        {
            "id": "variant-1",
            "title": "Descriptive title for video option",
            "searchQuery": "YouTube search query to find this type of tutorial",
            "style": "tutorial|lecture|walkthrough|animated",
            "instructorName": "Generic instructor type (e.g., 'Senior Developer', 'Professor')"
        }
    ],
    "estimated_time_minutes": 25,
    "difficulty": "${difficulty}"
}

## Section Requirements

Generate 4-6 sections following this structure:
1. **Fundamentals** - Core concepts with real-world analogies
2. **How It Works** - Deep dive with diagrams described in text, code examples
3. **Implementation** - Step-by-step guide with complete code examples
4. **Best Practices** - Production tips, patterns, anti-patterns
5. **Common Pitfalls** - Mistakes to avoid with solutions
6. **Practice Exercises** - Hands-on challenges (optional)

## Video Variants

Generate 3-5 video variant suggestions with YouTube search queries that would help find relevant tutorials:
- Different teaching styles (lecture vs hands-on)
- Different complexity levels
- Different instructors/channels known for quality

Return ONLY valid JSON, no markdown code blocks around it.`;

    try {
        const client = new Anthropic({ apiKey });

        console.log(`[ContentGen] Calling Anthropic for: ${chapterTitle}`);

        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            system: EXPERT_EDUCATOR_PROMPT,
        });

        // Extract text content
        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
            console.warn("[ContentGen] No text content in Anthropic response");
            return null;
        }

        // Parse JSON response
        let parsedContent;
        try {
            // Try to extract JSON from the response (handle potential markdown wrapper)
            let jsonText = textContent.text.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.slice(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.slice(0, -3);
            }
            parsedContent = JSON.parse(jsonText.trim());
        } catch (parseError) {
            console.error("[ContentGen] Failed to parse Anthropic JSON:", parseError);
            console.log("[ContentGen] Raw response:", textContent.text.substring(0, 500));
            return null;
        }

        console.log(`[ContentGen] Anthropic generated ${parsedContent.sections?.length || 0} sections`);

        return {
            content: parsedContent,
            metadata: {
                model_used: "claude-sonnet-4-20250514",
                generated_at: new Date().toISOString(),
                tokens_used: response.usage?.input_tokens + response.usage?.output_tokens,
                placeholder: false,
            },
        };
    } catch (error) {
        console.error("[ContentGen] Anthropic generation failed:", error);
        return null;
    }
}

// ============================================================================
// Enhanced Local Fallback Content Generation
// ============================================================================

function generateFallbackContent(chapter: any, userContext?: any): any {
    const chapterTitle = chapter.title || "Untitled Chapter";
    const courseTitle = chapter.courses?.title || "Course";
    const difficulty = chapter.courses?.difficulty || userContext?.experience_level || "beginner";

    // Generate rich placeholder content with proper markdown
    const introductionContent = `Understanding **${chapterTitle}** is a crucial step in mastering ${courseTitle}. This isn't just about memorizing syntax or patterns—it's about developing the intuition to know *when* and *why* to apply these concepts in real-world projects.

Think of this like learning to drive: anyone can memorize traffic rules, but becoming a good driver means understanding *why* those rules exist and developing the judgment to handle unexpected situations. By the end of this chapter, you'll have that same level of intuition for ${chapterTitle}.

:::info
This chapter is designed for ${difficulty} learners. We'll start with foundational concepts and progressively build toward more advanced applications.
:::`;

    const fundamentalsContent = `## Why ${chapterTitle} Matters

Before diving into the *how*, let's understand the *why*. ${chapterTitle} solves a fundamental challenge that developers face constantly: managing complexity while maintaining code that's readable, testable, and maintainable.

### The Problem We're Solving

In traditional approaches, you might encounter:
- Code that's difficult to test in isolation
- Components that are tightly coupled
- Logic that's scattered across multiple files
- State that's hard to track and debug

### The Solution

${chapterTitle} provides a structured approach that addresses these issues through well-established patterns.

\`\`\`typescript
// Before: Tightly coupled, hard to test
class UserService {
    private db = new DatabaseConnection();

    async getUser(id: string) {
        return this.db.query(\`SELECT * FROM users WHERE id = \${id}\`);
    }
}

// After: Loosely coupled, easily testable
class UserService {
    constructor(private db: IDatabase) {}

    async getUser(id: string) {
        return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    }
}
\`\`\`

:::tip
When learning new concepts, always ask yourself: "What problem does this solve?" Understanding the motivation makes the solution much easier to remember and apply correctly.
:::

:::warning
Avoid the temptation to apply every new pattern you learn to existing code. Start with new features or projects where you can experiment without risk.
:::`;

    const implementationContent = `## Implementing ${chapterTitle} Step by Step

Now let's walk through a practical implementation. We'll build something real that demonstrates the core concepts.

### Step 1: Setting Up the Foundation

First, we need to establish our base structure:

\`\`\`typescript
// types.ts - Define clear interfaces
interface Config {
    apiUrl: string;
    timeout: number;
    retryAttempts: number;
}

interface Logger {
    info(message: string): void;
    error(message: string, error?: Error): void;
    debug(message: string, data?: unknown): void;
}
\`\`\`

### Step 2: Creating the Core Implementation

\`\`\`typescript
// implementation.ts
export function createService(config: Config, logger: Logger) {
    const { apiUrl, timeout, retryAttempts } = config;

    async function fetchWithRetry<T>(endpoint: string): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                logger.debug(\`Attempt \${attempt} for \${endpoint}\`);
                const response = await fetch(\`\${apiUrl}\${endpoint}\`, {
                    signal: AbortSignal.timeout(timeout)
                });

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }

                return await response.json();
            } catch (error) {
                lastError = error as Error;
                logger.error(\`Attempt \${attempt} failed\`, lastError);
            }
        }

        throw lastError;
    }

    return { fetchWithRetry };
}
\`\`\`

### Step 3: Using the Implementation

\`\`\`typescript
// usage.ts
const config: Config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    retryAttempts: 3
};

const logger: Logger = {
    info: (msg) => console.log(\`[INFO] \${msg}\`),
    error: (msg, err) => console.error(\`[ERROR] \${msg}\`, err),
    debug: (msg, data) => console.debug(\`[DEBUG] \${msg}\`, data)
};

const service = createService(config, logger);
const userData = await service.fetchWithRetry('/users/123');
\`\`\`

:::tip
Notice how we can easily swap out the logger for testing. In unit tests, you'd use a mock logger that captures calls for assertions.
:::`;

    const bestPracticesContent = `## Best Practices and Production Tips

After years of applying these concepts in production systems, here are the patterns that consistently lead to success:

### 1. Keep It Simple

| Approach | When to Use | When to Avoid |
|----------|-------------|---------------|
| Simple function | Single responsibility, no state | Complex orchestration |
| Class with DI | Stateful operations, multiple methods | Simple utilities |
| Factory pattern | Dynamic configuration, multiple variants | Single implementation |

### 2. Write Tests First

Before implementing, write the test that describes what you want:

\`\`\`typescript
describe('UserService', () => {
    it('should fetch user by id', async () => {
        const mockDb = { query: jest.fn().mockResolvedValue({ id: '123', name: 'Test' }) };
        const service = new UserService(mockDb);

        const user = await service.getUser('123');

        expect(user.name).toBe('Test');
        expect(mockDb.query).toHaveBeenCalledWith(
            'SELECT * FROM users WHERE id = ?',
            ['123']
        );
    });
});
\`\`\`

### 3. Document Intent, Not Implementation

\`\`\`typescript
// ❌ Bad: Describes what the code does (obvious)
// Loops through users and filters by active status
const activeUsers = users.filter(u => u.isActive);

// ✅ Good: Describes why and business context
// Only active users should receive promotional emails per GDPR compliance
const eligibleRecipients = users.filter(u => u.isActive);
\`\`\`

:::warning
Premature optimization is the root of all evil. Profile your code before optimizing, and always measure the impact of your changes.
:::

:::tip
When in doubt, choose the simpler solution. You can always add complexity later, but removing it is much harder.
:::`;

    const exercisesContent = `## Practice Exercises

Apply what you've learned with these hands-on challenges:

### Exercise 1: Basic Implementation
Create a simple implementation following the patterns discussed. Focus on:
- Clear separation of concerns
- Testable code structure
- Proper error handling

### Exercise 2: Add Logging
Extend your implementation with a logging layer that tracks:
- All operations performed
- Time taken for each operation
- Any errors encountered

### Exercise 3: Production Hardening
Make your implementation production-ready:
- Add input validation
- Implement retry logic
- Add circuit breaker pattern for external calls

:::info
Don't worry about getting everything perfect on the first try. The goal is to practice applying these concepts and learn from the experience.
:::`;

    return {
        content: {
            title: chapterTitle,
            introduction: introductionContent,
            sections: [
                {
                    title: "Fundamentals",
                    content: fundamentalsContent,
                    type: "text",
                },
                {
                    title: "Step-by-Step Implementation",
                    content: implementationContent,
                    type: "text",
                },
                {
                    title: "Best Practices",
                    content: bestPracticesContent,
                    type: "text",
                },
                {
                    title: "Practice Exercises",
                    content: exercisesContent,
                    type: "exercise",
                },
            ],
            key_takeaways: [
                `Understand the core principles behind ${chapterTitle} and when to apply them`,
                "Always start by understanding the problem before jumping to solutions",
                "Write testable code by depending on abstractions, not concrete implementations",
                "Keep implementations simple—complexity can be added later if needed",
                "Document the 'why' not the 'what' in your code comments",
                "Practice with small projects before applying to production code",
                "Measure before optimizing—premature optimization causes more harm than good",
            ],
            video_variants: [
                {
                    id: "variant-tutorial",
                    title: "Hands-on Tutorial",
                    searchQuery: `${chapterTitle} tutorial ${new Date().getFullYear()} for ${difficulty}s`,
                    style: "tutorial",
                    instructorName: "Senior Developer",
                },
                {
                    id: "variant-lecture",
                    title: "Conceptual Deep Dive",
                    searchQuery: `${chapterTitle} explained concepts theory`,
                    style: "lecture",
                    instructorName: "Tech Educator",
                },
                {
                    id: "variant-walkthrough",
                    title: "Code Walkthrough",
                    searchQuery: `${chapterTitle} code walkthrough step by step`,
                    style: "walkthrough",
                    instructorName: "Full Stack Developer",
                },
            ],
            estimated_time_minutes: 30,
            difficulty: difficulty,
        },
        metadata: {
            model_used: "enhanced_local_fallback",
            generated_at: new Date().toISOString(),
            placeholder: true,
        },
    };
}

// ============================================================================
// Content Generation Orchestrator
// ============================================================================

async function generateContent(chapter: any, userContext?: any): Promise<any> {
    // Try Anthropic first (if API key available)
    const anthropicResult = await generateWithAnthropic(chapter, userContext);
    if (anthropicResult) {
        return anthropicResult;
    }

    // Fall back to enhanced local generation
    console.log(`[ContentGen] Using enhanced local fallback for: ${chapter.title}`);
    return generateFallbackContent(chapter, userContext);
}
