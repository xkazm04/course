# Lesson Content Generator Prompt

You are an expert curriculum designer creating comprehensive programming lessons. Generate lesson content following the exact structure and format specified below.

## Input Parameters

- **TOPIC**: {{TOPIC}} (e.g., "Closures", "React Hooks", "SQL Joins")
- **DOMAIN**: {{DOMAIN}} (e.g., "JavaScript", "Frontend Development", "Database Engineering")
- **SKILL_AREA**: {{SKILL_AREA}} (e.g., "Functions Deep Dive", "State Management", "Query Optimization")
- **DIFFICULTY**: {{DIFFICULTY}} (beginner | intermediate | advanced)
- **ESTIMATED_MINUTES**: {{ESTIMATED_MINUTES}} (15-45 recommended)

## Output Format

Generate a complete lesson with the following JSON structure:

```typescript
{
  content: LessonContent,
  sections: LessonSection[]
}
```

---

## Part 1: Lesson Content

Generate the main lesson content with:

### Introduction (2-4 paragraphs)
- Start with a bold concept definition
- Explain why this topic matters
- List 4-6 practical use cases as bullet points
- Set expectations for what the learner will master

### Content Markdown
Use standard markdown plus these custom blocks:

#### :::definition[title="Term"]
Define key terminology clearly and concisely.
```
:::definition[title="Closure"]
A **closure** is the combination of a function and the lexical environment within which that function was declared.
:::
```

#### :::code[language="xxx" title="Example Title"]
Show code examples with syntax highlighting.
```
:::code[language="javascript" title="Basic Example"]
function example() {
  return "code here";
}
:::
```

#### :::keypoints
Summarize 3-5 key takeaways as bullet points.
```
:::keypoints
- First key insight
- Second key insight
- Third key insight
:::
```

### Metadata
Include:
- `estimated_minutes`: Total lesson time
- `difficulty`: beginner | intermediate | advanced
- `key_takeaways`: Array of 4-6 concise strings
- `key_references`: Array of 3-5 helpful resources
- `video_variants`: 2-3 video recommendations with search queries
- `tags`: 5-8 relevant tags

---

## Part 2: Lesson Sections (4-6 sections)

Each section should be 5-10 minutes and include rich custom blocks:

### Section Types
- `lesson`: Conceptual explanation
- `interactive`: Hands-on examples with multiple approaches
- `exercise`: Practice problems
- `quiz`: Knowledge checks

### Extended Custom Blocks

#### :::tabs
Show the same concept in multiple languages or approaches:
```
:::tabs
## JavaScript [javascript]
// JavaScript implementation
const example = () => {};

## Python [python]
# Python implementation
def example():
    pass

## TypeScript [typescript]
// TypeScript implementation
const example = (): void => {};
:::
```

#### :::comparison[title="Title" left="Option A" right="Option B"]
Compare two approaches side-by-side:
```
:::comparison[title="State Management" left="useState" right="useReducer"]
LEFT:
// Simple state
const [count, setCount] = useState(0);
setCount(count + 1);

RIGHT:
// Complex state with actions
const [state, dispatch] = useReducer(reducer, init);
dispatch({ type: 'increment' });

VERDICT:
Use useState for simple values, useReducer for complex state logic.
:::
```

#### :::scenario[title="When to Use This"]
Explain practical use cases with clear guidance:
```
:::scenario[title="When to Use Closures"]
Closures are the right choice in many scenarios.

USE WHEN:
- You need private variables
- Creating function factories
- Preserving state in callbacks

AVOID WHEN:
- Simple pure functions
- Performance-critical loops

EXAMPLE:
function createCounter() {
  let count = 0;
  return () => ++count;
}
:::
```

#### :::steps[title="Step-by-Step Guide"]
Break down a process into numbered steps:
```
:::steps[title="Creating a Closure"]
## Define the Outer Function
Create the containing function with variables to capture.

\`\`\`javascript
function outer() {
  const value = "captured";
}
\`\`\`

## Create the Inner Function
Define the function that will form the closure.

\`\`\`javascript
function outer() {
  const value = "captured";
  return function inner() {
    return value;
  };
}
\`\`\`

## Return and Use
Return the inner function to create the closure.

\`\`\`javascript
const fn = outer();
fn(); // "captured"
\`\`\`
:::
```

#### :::pitfall[title="Common Mistake"]
Warn about common errors with wrong/right examples:
```
:::pitfall[title="The Loop Closure Bug"]
Creating closures in loops with var causes unexpected behavior.

WRONG:
\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3
\`\`\`

RIGHT:
\`\`\`javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2
\`\`\`

WHY:
var is function-scoped, so all callbacks share the same i.
let creates a new binding per iteration.
:::
```

#### :::deepdive[title="Advanced Topic"]
Provide deeper technical explanation:
```
:::deepdive[title="Memory Management"]
Closures hold references to their outer scope variables,
which can prevent garbage collection.

When a closure captures a variable:
1. The variable stays in memory
2. The closure maintains a reference
3. Memory is released when the closure is garbage collected

This is why long-lived closures with large captured
objects can cause memory leaks.
:::
```

#### :::realworld[title="Real Implementation"]
Show how concepts are used in popular libraries:
```
:::realworld[title="React useState Hook"]
React's useState uses closures internally.

\`\`\`javascript
// Simplified useState implementation
let state;
function useState(initial) {
  state = state ?? initial;
  const setState = (newValue) => {
    state = newValue;
    rerender();
  };
  return [state, setState];
}
\`\`\`

Each hook call captures its own index in the state array!
:::
```

#### :::syntax[name="functionName"]
Document function signatures clearly:
```
:::syntax[name="createCounter"]
Creates a private counter with increment/decrement methods.

SIGNATURE:
function createCounter(initial?: number): Counter

PARAMETERS:
- initial?: number - Starting value (default: 0)

RETURNS:
Counter - Object with increment, decrement, getCount methods

EXAMPLES:
\`\`\`javascript
const counter = createCounter(10);
counter.increment(); // 11
\`\`\`
:::
```

#### :::checkpoint[question="Question?" hint="Optional hint"]
Add comprehension checks:
```
:::checkpoint[question="Why does the loop bug occur with var?" hint="Think about scope"]
With var, there's only one binding for the entire function.
By the time callbacks execute, the loop has finished and
the variable holds its final value.
:::
```

#### :::protip[author="Expert Name"]
Share expert insights:
```
:::protip[author="Kyle Simpson"]
Closure is when a function "remembers" its lexical scope
even when executed outside that scope.
:::
```

#### :::warning[title="Warning Title"]
Highlight important cautions:
```
:::warning[title="Memory Leaks"]
Long-lived closures that capture large objects can cause
memory leaks. Clear references when no longer needed.
:::
```

---

## Quality Guidelines

### Content Quality
1. **Accuracy**: All code must be syntactically correct and runnable
2. **Progression**: Start simple, build complexity gradually
3. **Practical**: Include real-world applications, not just theory
4. **Complete**: Cover edge cases and common mistakes
5. **Concise**: Every sentence should add value

### Block Usage
- Use 2-3 different block types per section minimum
- Include at least one `:::tabs` block for language comparison
- Include at least one `:::pitfall` block for common mistakes
- Include at least one `:::realworld` block for practical application
- End each section with key_points array (3-5 points)

### Code Examples
- Show both simple and complex examples
- Include comments explaining non-obvious parts
- Use consistent naming conventions
- Test all code mentally for correctness

### Section Structure
Each section should have:
1. Brief intro paragraph
2. 2-4 custom blocks showcasing the concept
3. Code examples demonstrating the idea
4. A checkpoint or key_points for retention

---

## Example Output Structure

```json
{
  "content": {
    "id": "{{TOPIC_SLUG}}",
    "node_id": "{{TOPIC_SLUG}}-node",
    "version": 1,
    "status": "published",
    "introduction": "**{{TOPIC}}** is...",
    "content_markdown": "## What is {{TOPIC}}?\n\n:::definition[title=\"{{TOPIC}}\"]\n...",
    "metadata": {
      "estimated_minutes": {{ESTIMATED_MINUTES}},
      "difficulty": "{{DIFFICULTY}}",
      "key_takeaways": [...],
      "key_references": [
        { "title": "...", "url": "...", "type": "docs" }
      ],
      "video_variants": [
        { "id": "...", "title": "...", "search_query": "...", "instructor": "...", "style": "animated" }
      ],
      "tags": [...]
    }
  },
  "sections": [
    {
      "id": "section-1",
      "sort_order": 1,
      "title": "Understanding {{TOPIC}}",
      "section_type": "lesson",
      "duration_minutes": 5,
      "content_markdown": "...",
      "key_points": [...]
    }
  ]
}
```

---

## Generate Now

Create a comprehensive lesson on **{{TOPIC}}** for the **{{DOMAIN}}** domain at **{{DIFFICULTY}}** level. Include 4-6 detailed sections totaling approximately **{{ESTIMATED_MINUTES}}** minutes of content.

Focus on practical understanding with multiple code examples, real-world applications, and clear explanations of common mistakes. Use at least 8 different custom block types throughout the lesson.
