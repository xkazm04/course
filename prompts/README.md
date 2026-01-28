# Lesson Generation Prompts

This directory contains prompts for AI-assisted lesson content generation.

## lesson-generator.md

A comprehensive prompt for generating high-quality programming lessons with rich custom markdown blocks.

### Parameters

| Parameter | Required | Type | Description | Example |
|-----------|----------|------|-------------|---------|
| `TOPIC` | Yes | string | The specific concept being taught | "Closures", "React Hooks", "SQL Joins" |
| `DOMAIN` | Yes | string | The broader field or technology | "JavaScript", "Frontend Development", "Database Engineering" |
| `SKILL_AREA` | Yes | string | The skill category within the domain | "Functions Deep Dive", "State Management" |
| `DIFFICULTY` | Yes | enum | Learner level | `beginner` \| `intermediate` \| `advanced` |
| `ESTIMATED_MINUTES` | Yes | number | Target lesson duration | 15-45 (recommended) |

### Usage

1. Copy the prompt template
2. Replace all `{{PARAMETER}}` placeholders with your values
3. Submit to Claude, GPT-4, or any capable LLM
4. Parse the JSON output

**Example substitution:**
```
{{TOPIC}} → "Closures"
{{DOMAIN}} → "JavaScript"
{{SKILL_AREA}} → "Functions Deep Dive"
{{DIFFICULTY}} → "intermediate"
{{ESTIMATED_MINUTES}} → 25
```

### Output Format

The prompt generates a JSON object matching the `FullLesson` TypeScript interface:

```typescript
interface Output {
  content: LessonContent;  // Main lesson metadata and intro
  sections: LessonSection[]; // 4-6 detailed sections
}
```

### Custom Block Types

The generated content uses these custom markdown blocks:

| Block | Purpose | Best For |
|-------|---------|----------|
| `:::definition` | Term definitions | Key vocabulary |
| `:::code` | Syntax-highlighted code | Examples |
| `:::keypoints` | Summary bullets | Section endings |
| `:::tabs` | Multi-language examples | Cross-platform concepts |
| `:::comparison` | Side-by-side analysis | Trade-off discussions |
| `:::scenario` | Use case guidance | Decision making |
| `:::steps` | Sequential processes | Tutorials |
| `:::pitfall` | Common mistakes | Error prevention |
| `:::deepdive` | Advanced details | Optional depth |
| `:::realworld` | Library implementations | Practical context |
| `:::syntax` | API documentation | Function references |
| `:::checkpoint` | Comprehension checks | Knowledge validation |
| `:::protip` | Expert insights | Best practices |
| `:::warning` | Cautions | Safety notices |

### Scaling Across Domains

The prompt is domain-agnostic. Examples:

**Frontend Development:**
```
TOPIC: "React Server Components"
DOMAIN: "React"
SKILL_AREA: "Server-Side Rendering"
DIFFICULTY: "advanced"
```

**Backend:**
```
TOPIC: "Database Indexing"
DOMAIN: "PostgreSQL"
SKILL_AREA: "Query Optimization"
DIFFICULTY: "intermediate"
```

**DevOps:**
```
TOPIC: "Docker Networking"
DOMAIN: "Container Orchestration"
SKILL_AREA: "Infrastructure"
DIFFICULTY: "intermediate"
```

**Data Science:**
```
TOPIC: "Gradient Descent"
DOMAIN: "Machine Learning"
SKILL_AREA: "Optimization Algorithms"
DIFFICULTY: "intermediate"
```

### Quality Expectations

Generated lessons should include:

- 4-6 sections with 5-10 min content each
- At least 8 different custom block types
- Code examples in 2+ languages where applicable
- Real-world library/framework examples
- Common pitfalls with solutions
- Comprehension checkpoints
- 3-5 key references (docs, repos, tools)
- 2-3 video recommendations with search queries

### Integration

Parse the output and store in the database:

```typescript
import type { FullLesson } from "@/app/features/lesson-content";

const generated: FullLesson = JSON.parse(llmOutput);
// Store generated.content → lesson_content table
// Store generated.sections → lesson_sections table
```

### Tips for Better Results

1. **Be specific with TOPIC**: "React useEffect Cleanup" > "React Hooks"
2. **Match DIFFICULTY to audience**: beginner = no assumptions, advanced = assume fundamentals
3. **Adjust ESTIMATED_MINUTES**: More time = more sections and depth
4. **Review code examples**: Always verify syntax before publishing
5. **Iterate on references**: LLMs may suggest outdated resources
