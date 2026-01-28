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

Use these ADVANCED directives to create rich, interactive content. ALWAYS use at least 5-7 different directive types per lesson.

### 1. Code Block Directive (REQUIRED)
\`\`\`markdown
:::code[language="typescript" title="Example Function"]
function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`;
}
:::
\`\`\`

### 2. Tabbed Code Directive (USE OFTEN - great for showing alternatives)
\`\`\`markdown
:::tabs[title="Implementation Approaches"]
TAB: JavaScript
\\\`\\\`\\\`javascript
function add(a, b) {
  return a + b;
}
\\\`\\\`\\\`
TAB: TypeScript
\\\`\\\`\\\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\\\`\\\`\\\`
:::
\`\`\`
Use tabs for: JS vs TS, imperative vs declarative, different frameworks, before/after refactoring.

### 3. Pitfall Directive (REQUIRED - show common mistakes)
\`\`\`markdown
:::pitfall[title="Array Mutation in React State"]
WRONG:
\\\`\\\`\\\`javascript
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // Direct mutation!
setItems(items);
\\\`\\\`\\\`

RIGHT:
\\\`\\\`\\\`javascript
const [items, setItems] = useState([1, 2, 3]);
setItems([...items, 4]); // Creates new array
\\\`\\\`\\\`

WHY:
React uses reference equality to detect changes. Mutating the existing array keeps the same reference, so React won't re-render.
:::
\`\`\`

### 4. Comparison Directive (for contrasting approaches)
\`\`\`markdown
:::comparison[title="Mutable vs Immutable" left="Mutable" right="Immutable"]
LEFT:
\\\`\\\`\\\`javascript
const arr = [1, 2, 3];
arr.push(4); // Mutates original
\\\`\\\`\\\`

RIGHT:
\\\`\\\`\\\`javascript
const arr = [1, 2, 3];
const newArr = [...arr, 4]; // Creates new array
\\\`\\\`\\\`

VERDICT:
Prefer immutable operations for predictable state management.
:::
\`\`\`

### 5. Real-World Directive (REQUIRED - practical context)
\`\`\`markdown
:::realworld[title="E-commerce Search"]
Search functionality in online stores uses debouncing to prevent excessive API calls. As users type "running shoes", each keystroke would trigger a search without debouncing. With a 300ms debounce, the search only fires after the user pauses typing, reducing server load by 80% while maintaining responsive UX.
:::
\`\`\`

### 6. Steps Directive (for tutorials and processes)
\`\`\`markdown
:::steps[title="Setting Up Your Project"]
Step 1: Install Dependencies
Run \\\`npm install\\\` to install all required packages.

Step 2: Configure Environment
Create a \\\`.env\\\` file with your API keys.

Step 3: Start Development Server
Run \\\`npm run dev\\\` to start the local server.
:::
\`\`\`

### 7. Deep Dive Directive (for advanced optional content)
\`\`\`markdown
:::deepdive[title="How V8 Optimizes This Pattern"]
V8's TurboFan compiler recognizes common patterns like array spreading and optimizes them at runtime. The spread operator [...arr] compiles to efficient native code when the array length is known at compile time.
:::
\`\`\`

### 8. Key Points Directive (for summaries)
\`\`\`markdown
:::keypoints[title="Key Concepts"]
- First important point
- Second important point
- Third important point
:::
\`\`\`

### 9. Definition Directive (for key terms)
\`\`\`markdown
:::definition[title="Generic Constraint"]
A constraint limits what types can be used with a generic parameter.
:::
\`\`\`

### 10. Standard Callouts
:::tip[title="Pro Tip"]
Pro tips and best practices go here
:::

:::warning[title="Be Careful"]
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

## Content Quality Standards (CRITICAL)

### Required Directives Per Section
EVERY section MUST include:
- At least 1 :::tabs block showing different approaches/languages
- At least 1 :::pitfall block showing wrong vs right code
- At least 1 :::realworld block with practical context
- At least 1 :::tip with pro advice

### Additional Guidelines
- Each section should have 400+ words of substantive content
- Include 3-4 code examples per technical section
- Use :::comparison when contrasting two approaches
- Use :::steps for any multi-step process
- Use :::deepdive for advanced topics (collapsed by default)
- Use :::keypoints to summarize key takeaways
- Use :::definition for important terms
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
            "content": "Full markdown content using RICH DIRECTIVES (see below). Minimum 400 words.",
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

## CRITICAL: Rich Directive Requirements

EVERY section MUST use these advanced directives (not just basic :::tip/:::warning):

1. **:::tabs** - Show code in multiple languages/approaches (JS vs TS, before/after, etc.)
2. **:::pitfall** - Show WRONG code, RIGHT code, and WHY explanation
3. **:::realworld** - Provide practical real-world context and examples
4. **:::comparison** - Compare two approaches with LEFT, RIGHT, VERDICT sections
5. **:::steps** - Use for any multi-step process (Step 1:, Step 2:, etc.)
6. **:::deepdive** - Collapsible advanced content
7. **:::keypoints** - Summarize key takeaways as bullet list
8. **:::definition** - Define important terms
9. **:::tip** and **:::warning** - Pro tips and cautions

Each section should include AT LEAST:
- 1 :::tabs block
- 1 :::pitfall block (with WRONG:, RIGHT:, WHY: sections)
- 1 :::realworld block
- 1-2 :::tip blocks

## Section Requirements

Generate 4-6 sections following this structure:
1. **Fundamentals** - Core concepts with :::definition, :::realworld, analogies
2. **How It Works** - Deep dive with :::tabs (different approaches), :::comparison
3. **Implementation** - :::steps directive for step-by-step, :::tabs for code variants
4. **Best Practices** - :::tip blocks, :::comparison (good vs bad patterns)
5. **Common Pitfalls** - MULTIPLE :::pitfall blocks showing mistakes to avoid
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

    // Generate rich placeholder content with advanced directives
    const introductionContent = `Understanding **${chapterTitle}** is a crucial step in mastering ${courseTitle}. This isn't just about memorizing syntax or patterns—it's about developing the intuition to know *when* and *why* to apply these concepts in real-world projects.

Think of this like learning to drive: anyone can memorize traffic rules, but becoming a good driver means understanding *why* those rules exist and developing the judgment to handle unexpected situations. By the end of this chapter, you'll have that same level of intuition for ${chapterTitle}.

:::keypoints[title="What You'll Learn"]
- Core concepts and principles behind ${chapterTitle}
- Practical implementation patterns
- Common mistakes and how to avoid them
- Real-world applications and use cases
:::`;

    const fundamentalsContent = `## Why ${chapterTitle} Matters

Before diving into the *how*, let's understand the *why*. ${chapterTitle} solves a fundamental challenge that developers face constantly: managing complexity while maintaining code that's readable, testable, and maintainable.

:::definition[title="${chapterTitle}"]
A structured approach to software design that addresses common challenges in code organization, testability, and maintainability through well-established patterns and principles.
:::

### The Problem We're Solving

In traditional approaches, you might encounter:
- Code that's difficult to test in isolation
- Components that are tightly coupled
- Logic that's scattered across multiple files
- State that's hard to track and debug

:::realworld[title="Enterprise Applications"]
Large-scale applications like Slack, Netflix, and Stripe all use these patterns extensively. Netflix's microservices architecture relies heavily on dependency injection and clean separation of concerns to manage over 1,000 services. When a team can work on one service without affecting others, that's ${chapterTitle} in action.
:::

### The Solution

:::tabs[title="Before vs After"]
TAB: Before (Tightly Coupled)
\`\`\`typescript
class UserService {
    private db = new DatabaseConnection();

    async getUser(id: string) {
        return this.db.query(\`SELECT * FROM users WHERE id = \${id}\`);
    }
}
\`\`\`
TAB: After (Loosely Coupled)
\`\`\`typescript
class UserService {
    constructor(private db: IDatabase) {}

    async getUser(id: string) {
        return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    }
}
\`\`\`
:::

:::pitfall[title="Hardcoded Dependencies"]
WRONG:
\`\`\`typescript
class UserService {
    private db = new DatabaseConnection(); // Hardcoded!
}
\`\`\`

RIGHT:
\`\`\`typescript
class UserService {
    constructor(private db: IDatabase) {} // Injected!
}
\`\`\`

WHY:
Hardcoded dependencies make testing impossible without hitting real databases. Injected dependencies allow you to swap in mocks for isolated unit tests.
:::

:::tip[title="Understanding Before Implementing"]
When learning new concepts, always ask yourself: "What problem does this solve?" Understanding the motivation makes the solution much easier to remember and apply correctly.
:::`;

    const implementationContent = `## Implementing ${chapterTitle} Step by Step

Now let's walk through a practical implementation. We'll build something real that demonstrates the core concepts.

:::steps[title="Implementation Process"]
Step 1: Define Your Interfaces
Start by defining clear contracts for your dependencies. This enables loose coupling and testability.

Step 2: Create the Core Implementation
Build your main logic depending only on interfaces, not concrete implementations.

Step 3: Wire Up Dependencies
Connect everything together at the application entry point.

Step 4: Write Tests
Verify your implementation works correctly by testing with mock dependencies.
:::

### Step 1: Setting Up the Foundation

:::code[language="typescript" title="types.ts - Define Clear Interfaces"]
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
:::

### Step 2: Creating the Core Implementation

:::tabs[title="Implementation Approaches"]
TAB: Functional
\`\`\`typescript
export function createService(config: Config, logger: Logger) {
    const { apiUrl, timeout, retryAttempts } = config;

    async function fetchWithRetry<T>(endpoint: string): Promise<T> {
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                logger.debug(\`Attempt \${attempt} for \${endpoint}\`);
                const response = await fetch(\`\${apiUrl}\${endpoint}\`, {
                    signal: AbortSignal.timeout(timeout)
                });
                if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
                return await response.json();
            } catch (error) {
                logger.error(\`Attempt \${attempt} failed\`, error as Error);
                if (attempt === retryAttempts) throw error;
            }
        }
        throw new Error('All attempts failed');
    }

    return { fetchWithRetry };
}
\`\`\`
TAB: Class-Based
\`\`\`typescript
export class ApiService {
    constructor(
        private config: Config,
        private logger: Logger
    ) {}

    async fetchWithRetry<T>(endpoint: string): Promise<T> {
        const { apiUrl, timeout, retryAttempts } = this.config;
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                this.logger.debug(\`Attempt \${attempt} for \${endpoint}\`);
                const response = await fetch(\`\${apiUrl}\${endpoint}\`, {
                    signal: AbortSignal.timeout(timeout)
                });
                if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
                return await response.json();
            } catch (error) {
                this.logger.error(\`Attempt \${attempt} failed\`, error as Error);
                if (attempt === retryAttempts) throw error;
            }
        }
        throw new Error('All attempts failed');
    }
}
\`\`\`
:::

:::realworld[title="Production Retry Patterns"]
Companies like AWS and Stripe implement exponential backoff in their SDKs. The first retry happens after 100ms, the second after 200ms, then 400ms, and so on. This prevents overwhelming a recovering service with immediate retries.
:::

:::tip[title="Testing Made Easy"]
Notice how we can easily swap out the logger for testing. In unit tests, you'd use a mock logger that captures calls for assertions.
:::`;

    const bestPracticesContent = `## Best Practices and Production Tips

After years of applying these concepts in production systems, here are the patterns that consistently lead to success.

:::comparison[title="Simple vs Complex Solutions" left="Over-Engineered" right="Just Right"]
LEFT:
\`\`\`typescript
// Too many abstractions
const factory = new ServiceFactoryBuilderImpl();
const builder = factory.createBuilder();
const service = builder.build();
\`\`\`

RIGHT:
\`\`\`typescript
// Simple and clear
const service = new UserService(db);
\`\`\`

VERDICT:
Start simple. Only add abstractions when you have a clear, immediate need for them.
:::

### When to Use Each Approach

| Approach | When to Use | When to Avoid |
|----------|-------------|---------------|
| Simple function | Single responsibility, no state | Complex orchestration |
| Class with DI | Stateful operations, multiple methods | Simple utilities |
| Factory pattern | Dynamic configuration, multiple variants | Single implementation |

:::pitfall[title="Premature Abstraction"]
WRONG:
\`\`\`typescript
// Creating interfaces for everything
interface IStringFormatter { format(s: string): string; }
class UpperCaseFormatter implements IStringFormatter {
    format(s: string) { return s.toUpperCase(); }
}
\`\`\`

RIGHT:
\`\`\`typescript
// Just use the built-in method
const formatted = input.toUpperCase();
\`\`\`

WHY:
Abstractions have a cost. Only create them when you need to swap implementations or when you have multiple consumers.
:::

:::deepdive[title="SOLID Principles Applied"]
The patterns we've discussed directly implement several SOLID principles:

**Single Responsibility**: Each class/function does one thing well.
**Open/Closed**: Extend behavior through composition, not modification.
**Liskov Substitution**: Any implementation of an interface should work interchangeably.
**Interface Segregation**: Keep interfaces small and focused.
**Dependency Inversion**: Depend on abstractions, not concretions.
:::

:::tip[title="Simplicity First"]
When in doubt, choose the simpler solution. You can always add complexity later, but removing it is much harder.
:::

:::warning[title="Avoid Premature Optimization"]
Profile your code before optimizing, and always measure the impact of your changes. Premature optimization is the root of all evil.
:::`;

    const exercisesContent = `## Practice Exercises

Apply what you've learned with these hands-on challenges.

:::steps[title="Exercise Progression"]
Step 1: Basic Implementation
Create a simple implementation following the patterns discussed. Focus on clear separation of concerns and testable code structure.

Step 2: Add Logging
Extend your implementation with a logging layer that tracks all operations, timing, and errors.

Step 3: Production Hardening
Make your implementation production-ready with input validation, retry logic, and circuit breaker pattern.
:::

### Exercise 1: Basic Implementation

Create a service that fetches user data from an API. Requirements:
- Accept configuration via constructor/factory
- Return typed user objects
- Handle errors gracefully

:::pitfall[title="Exercise Common Mistake"]
WRONG:
\`\`\`typescript
async function getUser(id: string) {
    const response = await fetch('/api/users/' + id);
    return response.json(); // No error handling!
}
\`\`\`

RIGHT:
\`\`\`typescript
async function getUser(id: string): Promise<User> {
    const response = await fetch('/api/users/' + id);
    if (!response.ok) {
        throw new ApiError(response.status, await response.text());
    }
    return response.json() as Promise<User>;
}
\`\`\`

WHY:
Always check response.ok before parsing JSON. A 404 or 500 response will still have a body, but it won't be the data you expect.
:::

:::realworld[title="Interview Question"]
"Design a caching layer for user data" is a common system design interview question. The patterns you've learned here—dependency injection, interface contracts, and error handling—are exactly what interviewers look for.
:::

:::tip[title="Practice Approach"]
Don't worry about getting everything perfect on the first try. The goal is to practice applying these concepts and learn from the experience.
:::`;

    const keypointsContent = `## Summary

:::keypoints[title="Key Takeaways"]
- Understand the core principles behind ${chapterTitle} and when to apply them
- Always start by understanding the problem before jumping to solutions
- Write testable code by depending on abstractions, not concrete implementations
- Keep implementations simple—complexity can be added later if needed
- Document the 'why' not the 'what' in your code comments
- Practice with small projects before applying to production code
- Measure before optimizing—premature optimization causes more harm than good
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
                {
                    title: "Summary",
                    content: keypointsContent,
                    type: "text",
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
