// ============================================================================
// Setup Lesson Content - Creates table and seeds example lesson
// Run with: npx tsx scripts/setup-lesson-content.ts
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
let envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, "..", ".env");
}
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            let value = trimmed.substring(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// Example Lesson Content - "Closures Explained" from JavaScript Mastery
// ============================================================================

const EXAMPLE_LESSON_SLUG = "closures-explained";

const EXAMPLE_INTRODUCTION = `
**Closures** are one of the most powerful yet misunderstood concepts in JavaScript. A closure is created when a function "remembers" the variables from its outer scope, even after that outer function has finished executing.

Understanding closures unlocks patterns like:
- Private variables and encapsulation
- Factory functions and currying
- Event handlers that preserve state
- Module patterns for code organization
`;

const EXAMPLE_CONTENT_MARKDOWN = `
## What is a Closure?

A closure is a function bundled together with references to its surrounding state (the **lexical environment**). In simpler terms, a closure gives you access to an outer function's scope from an inner function.

:::callout[type="definition"]
A **closure** is the combination of a function and the lexical environment within which that function was declared.
:::

## How Closures Work

Every function in JavaScript forms a closure. When a function is created, it keeps a reference to its lexical environment. This environment contains any local variables that were in scope at the time the closure was created.

:::code[language="javascript" title="Basic Closure Example"]
function createGreeter(greeting) {
  // 'greeting' is captured by the inner function
  return function(name) {
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = createGreeter("Hello");
const sayHi = createGreeter("Hi");

console.log(sayHello("Alice")); // "Hello, Alice!"
console.log(sayHi("Bob"));      // "Hi, Bob!"
:::

Notice how \`sayHello\` and \`sayHi\` each "remember" their own \`greeting\` value, even though \`createGreeter\` has finished executing.

## Practical Use Cases

### 1. Private Variables

Closures enable data privacy—a pattern commonly used to create private variables:

:::code[language="javascript" title="Private Counter"]
function createCounter() {
  let count = 0; // Private variable

  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
console.log(counter.count);      // undefined (private!)
:::

### 2. Function Factories

Create specialized functions from a template:

:::code[language="javascript" title="Multiplier Factory"]
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
:::

### 3. Event Handlers with State

Closures are essential for event handlers that need to track state:

:::code[language="javascript" title="Click Counter"]
function setupClickCounter(buttonId) {
  let clicks = 0;

  document.getElementById(buttonId).addEventListener('click', () => {
    clicks++;
    console.log(\`Button clicked \${clicks} times\`);
  });
}

setupClickCounter('myButton');
:::

## Common Pitfalls

:::callout[type="warning"]
**The Loop Problem**: A classic closure gotcha involves loops. Variables declared with \`var\` are function-scoped, not block-scoped.
:::

:::code[language="javascript" title="The Classic Loop Bug"]
// ❌ Bug: All callbacks log '3'
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3

// ✅ Fix 1: Use let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2

// ✅ Fix 2: Create closure with IIFE
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2
:::

## Memory Considerations

:::callout[type="info"]
Closures can lead to memory issues if not managed properly. The referenced variables cannot be garbage collected as long as the closure exists.
:::

Best practices:
- Set closures to \`null\` when no longer needed
- Be mindful of closures in long-lived objects
- Use WeakMaps for caches to allow garbage collection

## Summary

:::keypoints
- Closures capture variables from their lexical scope
- They enable private variables and data encapsulation
- Function factories leverage closures for specialization
- Watch out for loop closure bugs—use \`let\` or IIFEs
- Consider memory implications for long-lived closures
:::
`;

const EXAMPLE_METADATA = {
    estimated_minutes: 20,
    difficulty: "intermediate",
    key_takeaways: [
        "Closures capture variables from their surrounding scope",
        "They enable private variables and encapsulation",
        "Function factories use closures to create specialized functions",
        "The classic loop bug is solved with let or IIFEs",
        "Be mindful of memory with long-lived closures"
    ],
    video_variants: [
        {
            id: "fireship-closures",
            title: "Closures in 100 Seconds",
            youtube_id: "vKJpN5FAeF4",
            search_query: "javascript closures explained",
            instructor: "Fireship",
            style: "animated",
            duration: "2:30"
        },
        {
            id: "traversy-closures",
            title: "JavaScript Closures Tutorial",
            search_query: "javascript closures tutorial traversy media",
            instructor: "Traversy Media",
            style: "tutorial",
            duration: "15:00"
        },
        {
            id: "academind-closures",
            title: "JavaScript Closures - A Deep Dive",
            search_query: "javascript closures academind",
            instructor: "Academind",
            style: "lecture",
            duration: "25:00"
        }
    ],
    tags: ["javascript", "closures", "scope", "functions", "intermediate"]
};

const EXAMPLE_SECTIONS = [
    {
        sort_order: 1,
        title: "What is a Closure?",
        section_type: "video",
        duration_minutes: 3,
        content_markdown: `A closure is a function bundled together with references to its surrounding state. When a function is created inside another function, it captures variables from the outer scope.

This concept is fundamental to JavaScript and enables powerful patterns like private variables, factories, and modules.`,
        key_points: [
            "Closures capture the lexical environment",
            "Every function in JavaScript forms a closure",
            "Inner functions can access outer function variables"
        ]
    },
    {
        sort_order: 2,
        title: "How Closures Work",
        section_type: "lesson",
        duration_minutes: 5,
        content_markdown: `When a function is defined, it keeps a reference to all variables in its scope chain. This reference persists even after the outer function completes execution.`,
        code_snippet: `function createGreeter(greeting) {
  return function(name) {
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = createGreeter("Hello");
console.log(sayHello("Alice")); // "Hello, Alice!"`,
        code_language: "javascript",
        key_points: [
            "Functions keep references to outer variables",
            "Each closure has its own captured environment",
            "Variables are captured by reference, not value"
        ]
    },
    {
        sort_order: 3,
        title: "Practical Patterns",
        section_type: "interactive",
        duration_minutes: 8,
        content_markdown: `Closures enable several important patterns:

1. **Private Variables**: Hide implementation details
2. **Function Factories**: Create specialized functions
3. **Partial Application**: Pre-fill function arguments
4. **Module Pattern**: Organize code with public/private interfaces`,
        code_snippet: `// Private variable pattern
function createCounter() {
  let count = 0; // Private!
  return {
    increment() { count++; },
    getCount() { return count; }
  };
}`,
        code_language: "javascript",
        key_points: [
            "Private variables via closure scope",
            "Factory functions create specialized closures",
            "Module pattern organizes public/private code"
        ]
    },
    {
        sort_order: 4,
        title: "Common Pitfalls",
        section_type: "lesson",
        duration_minutes: 4,
        content_markdown: `The classic closure pitfall involves loops and var declarations. Since var is function-scoped, all iterations share the same variable.

**Solution**: Use \`let\` (block-scoped) or an IIFE to create a new scope per iteration.`,
        code_snippet: `// Bug: outputs 3, 3, 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}

// Fix: use let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}`,
        code_language: "javascript",
        key_points: [
            "var is function-scoped, not block-scoped",
            "Use let to create per-iteration scope",
            "IIFEs can also solve the loop problem"
        ]
    }
];

async function setup() {
    console.log("🚀 Setting up lesson content...\n");

    // Step 1: Check if tables exist, create if not
    console.log("📋 Checking/creating lesson_content table...");

    // Try to query the table first
    const { error: checkError } = await supabase
        .from("lesson_content")
        .select("id")
        .limit(1);

    if (checkError && checkError.message.includes("does not exist")) {
        console.log("   Table doesn't exist. Please run the migration manually:");
        console.log("   supabase db push (or apply migration via Supabase dashboard)");
        console.log("\n   Migration file: supabase/migrations/016_lesson_content.sql");

        // Try to create table via raw SQL
        console.log("\n   Attempting to create via SQL...");

        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS lesson_content (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
                version INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'draft',
                introduction TEXT,
                content_markdown TEXT NOT NULL,
                metadata JSONB DEFAULT '{}'::jsonb,
                is_ai_generated BOOLEAN DEFAULT FALSE,
                ai_model VARCHAR(50),
                ai_confidence DECIMAL(3, 2),
                generation_prompt TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                published_at TIMESTAMPTZ,
                UNIQUE(node_id, version)
            );

            CREATE TABLE IF NOT EXISTS lesson_sections (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lesson_content_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,
                sort_order INTEGER NOT NULL,
                title VARCHAR(500) NOT NULL,
                section_type VARCHAR(50) DEFAULT 'lesson',
                duration_minutes INTEGER,
                content_markdown TEXT NOT NULL,
                code_snippet TEXT,
                code_language VARCHAR(20),
                key_points TEXT[],
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(lesson_content_id, sort_order)
            );
        `;

        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        if (createError) {
            console.log("   Could not create tables via RPC. Manual migration required.");
            console.log("   Continuing to check if tables exist now...");
        }
    } else {
        console.log("   ✅ Table exists");
    }

    // Step 2: Find the lesson node
    console.log("\n📍 Finding lesson node...");
    const { data: lessonNode, error: nodeError } = await supabase
        .from("map_nodes")
        .select("id, name, slug, parent_id, domain_id")
        .eq("slug", EXAMPLE_LESSON_SLUG)
        .eq("depth", 4)
        .single();

    if (nodeError || !lessonNode) {
        console.log(`   ❌ Lesson node '${EXAMPLE_LESSON_SLUG}' not found.`);
        console.log("   Searching for any lesson node to use...");

        const { data: anyLesson } = await supabase
            .from("map_nodes")
            .select("id, name, slug, parent_id")
            .eq("depth", 4)
            .eq("domain_id", "frontend")
            .limit(1)
            .single();

        if (!anyLesson) {
            console.log("   ❌ No lesson nodes found. Run seed-frontend-curriculum.ts first.");
            process.exit(1);
        }

        console.log(`   ✅ Using lesson: ${anyLesson.name} (${anyLesson.slug})`);
        await seedLessonContent(anyLesson.id, anyLesson.name, anyLesson.slug);
    } else {
        console.log(`   ✅ Found: ${lessonNode.name}`);
        await seedLessonContent(lessonNode.id, lessonNode.name, lessonNode.slug);
    }
}

async function seedLessonContent(nodeId: string, nodeName: string, nodeSlug: string) {
    console.log("\n📝 Creating lesson content...");

    // Check if content already exists using raw query
    const { data: existing } = await supabase
        .rpc('get_lesson_content_by_node', { p_node_id: nodeId })
        .maybeSingle();

    // Alternative: direct SQL query
    const { data: existingRaw, error: checkErr } = await supabase
        .from("lesson_content")
        .select("id")
        .eq("node_id", nodeId);

    if (existingRaw && existingRaw.length > 0) {
        console.log("   ⚠️  Content already exists for this lesson. Deleting old content...");
        await supabase.from("lesson_content").delete().eq("node_id", nodeId);
    }

    // Insert using raw SQL via rpc if the typed insert fails
    const { data: content, error: contentError } = await supabase
        .from("lesson_content")
        .insert({
            node_id: nodeId,
            version: 1,
            status: "published",
            introduction: EXAMPLE_INTRODUCTION.trim(),
            content_markdown: EXAMPLE_CONTENT_MARKDOWN.trim(),
            metadata: EXAMPLE_METADATA,
            is_ai_generated: false,
            published_at: new Date().toISOString()
        } as any)  // Cast to any to bypass type checking
        .select("id")
        .single();

    if (contentError) {
        console.log(`   ⚠️  Typed insert failed: ${contentError.message}`);
        console.log("   Trying alternative approach...");

        // Try using SQL directly via postgres function
        const insertSQL = `
            INSERT INTO lesson_content (node_id, version, status, introduction, content_markdown, metadata, is_ai_generated, published_at)
            VALUES ($1, 1, 'published', $2, $3, $4::jsonb, false, NOW())
            RETURNING id
        `;

        // Use a simpler approach - just insert without returning
        const { error: insertError } = await supabase
            .from("lesson_content")
            .upsert({
                node_id: nodeId,
                version: 1,
                status: "published",
                introduction: EXAMPLE_INTRODUCTION.trim(),
                content_markdown: EXAMPLE_CONTENT_MARKDOWN.trim(),
                metadata: EXAMPLE_METADATA,
                is_ai_generated: false,
                published_at: new Date().toISOString()
            } as any, { onConflict: 'node_id,version' });

        if (insertError) {
            console.log(`   ❌ Upsert also failed: ${insertError.message}`);
            console.log("\n   The lesson_content table may need to be added to the Supabase schema.");
            console.log("   Please run the migration via Supabase Dashboard > SQL Editor:");
            console.log("   Copy contents of: supabase/migrations/016_lesson_content.sql");
            process.exit(1);
        }

        // Fetch the inserted content
        const { data: insertedContent } = await supabase
            .from("lesson_content")
            .select("id")
            .eq("node_id", nodeId)
            .single();

        if (!insertedContent) {
            console.log("   ❌ Could not verify insertion");
            process.exit(1);
        }

        console.log(`   ✅ Created lesson content via upsert (${insertedContent.id})`);
        await seedSections(insertedContent.id);
        printSummary(nodeName, nodeSlug, nodeId, insertedContent.id);
        return;
    }

    console.log(`   ✅ Created lesson content (${content.id})`);
    await seedSections(content.id);
    printSummary(nodeName, nodeSlug, nodeId, content.id);
}

async function seedSections(contentId: string) {
    console.log("\n📚 Creating lesson sections...");
    for (const section of EXAMPLE_SECTIONS) {
        const { error: sectionError } = await supabase
            .from("lesson_sections")
            .insert({
                lesson_content_id: contentId,
                ...section
            } as any);

        if (sectionError) {
            console.log(`   ❌ Section '${section.title}': ${sectionError.message}`);
        } else {
            console.log(`   ✅ Section: ${section.title}`);
        }
    }
}

function printSummary(nodeName: string, nodeSlug: string, nodeId: string, contentId: string) {
    console.log("\n" + "=".repeat(60));
    console.log("✅ LESSON CONTENT SEEDED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`Lesson: ${nodeName}`);
    console.log(`Slug: ${nodeSlug}`);
    console.log(`Node ID: ${nodeId}`);
    console.log(`Content ID: ${contentId}`);
    console.log(`Sections: ${EXAMPLE_SECTIONS.length}`);
    console.log("=".repeat(60));
}

setup().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
});
