# Lesson Markdown Syntax Reference

This document describes the custom markdown directives available for creating rich, interactive lesson content. These directives extend standard markdown with specialized components for educational content.

## Table of Contents

- [Standard Markdown](#standard-markdown)
- [Callout Directives](#callout-directives)
- [Key Points Directive](#key-points-directive)
- [Code Block Directive](#code-block-directive)
- [Tabbed Code Directive](#tabbed-code-directive)
- [Animated Code Directive](#animated-code-directive)
- [Comparison Directive](#comparison-directive)
- [Steps Directive](#steps-directive)
- [Pitfall Directive](#pitfall-directive)
- [Real-World Directive](#real-world-directive)
- [Deep Dive Directive](#deep-dive-directive)

> **Related Documentation:**
> - [Remotion Video Techniques](./remotion-video-techniques.md) - Advanced video generation guide

---

## Standard Markdown

All standard GitHub-Flavored Markdown is supported, including:

- **Headers** (`#`, `##`, `###`, `####`)
- **Bold** (`**text**`) and *Italic* (`*text*`)
- **Links** (`[text](url)`)
- **Lists** (ordered and unordered)
- **Blockquotes** (`> text`)
- **Inline code** (`` `code` ``)
- **Code blocks** (triple backticks with language)
- **Tables**
- **Horizontal rules** (`---`)

---

## Callout Directives

Callouts highlight important information with distinct visual styling.

### Available Types

| Type | Purpose | Visual Style |
|------|---------|--------------|
| `definition` | Define key terms | Violet border, BookOpen icon |
| `tip` | Helpful suggestions | Emerald border, Lightbulb icon |
| `warning` | Caution notices | Amber border, AlertTriangle icon |
| `info` | General information | Sky border, Info icon |
| `example` | Usage examples | Pink border, Sparkles icon |
| `note` | Additional notes | Slate border, Target icon |

### Syntax

```markdown
:::definition[title="Optional Title"]
Content goes here. Supports **markdown** formatting.
:::

:::tip[title="Pro Tip"]
This is a helpful suggestion for the reader.
:::

:::warning[title="Be Careful"]
This warns the reader about potential issues.
:::

:::info
Information without a title is also valid.
:::
```

### Shorthand Syntax

For simple callouts, use the type directly:

```markdown
:::tip
Quick tip without attributes.
:::

:::warning
Warning message here.
:::
```

---

## Key Points Directive

Displays a styled list of key takeaways or important points. Commonly used to summarize lesson concepts.

### Syntax

```markdown
:::keypoints[title="Key Concepts"]
- First important point
- Second important point
- Third important point
- Fourth important point
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title (default: "Key Points") |

### Features

- Numbered bullet points with ember accent
- Gradient background matching brand
- Each point on its own line
- Lines starting with `-` or `*` are parsed as points

### Use Cases

- Summarizing lesson concepts at the start
- Listing learning objectives
- Quick reference cards
- TL;DR summaries

---

## Code Block Directive

Displays syntax-highlighted code with copy functionality.

### Syntax

```markdown
:::code[language="typescript" title="Example Function"]
function greet(name: string): string {
  return `Hello, ${name}!`;
}
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `language` | No | Programming language (default: "typescript") |
| `title` | No | Title displayed in the code header |

### Supported Languages

TypeScript, JavaScript, Python, Rust, Go, Java, and most common languages are supported with syntax highlighting.

---

## Tabbed Code Directive

**NEW** - Displays multiple code variants with switchable tabs. Perfect for showing different approaches to the same problem.

### Syntax

```markdown
:::tabs[title="Implementation Approaches"]
TAB: JavaScript
```javascript
function add(a, b) {
  return a + b;
}
```
TAB: TypeScript
```typescript
function add(a: number, b: number): number {
  return a + b;
}
```
TAB: Python
```python
def add(a: int, b: int) -> int:
    return a + b
```
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title displayed above the tabs |

### Tab Format

Each tab is defined with:
```
TAB: Label
```language
code here
```
```

The label appears on the tab button. You can have 2-4 tabs per block.

### Use Cases

- Comparing JavaScript vs TypeScript implementations
- Showing imperative vs declarative approaches
- Demonstrating multiple framework options
- Before/After refactoring examples

---

## Animated Code Directive

**NEW** - Embeds a Remotion-style animated code walkthrough. The code is revealed character-by-character with a typing animation, visual flow diagrams, and optional annotation sidebar.

### Syntax

```markdown
:::animated[title="How Generics Work" description="Step-by-step type flow"]
```typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
```
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title for the animation (default: "Code Walkthrough") |
| `description` | No | Subtitle text explaining the walkthrough |
| `language` | No | Programming language (default: "typescript") |

### Features

1. **Typewriter Animation**: Code appears character-by-character with realistic typing speed
2. **Shadow Preview**: Full code visible as ghost text before typing reaches it
3. **Data Flow Visualization**: Animated diagram showing Input → Process → Output flow
4. **Auto-Scroll**: Viewport automatically follows the cursor
5. **Play Controls**: Play, pause, and reset buttons
6. **Fullscreen Mode**: Expand to full screen for better viewing
7. **Keyboard Shortcuts**: Space (play/pause), R (reset), Escape (exit fullscreen)
8. **Auto-Generated Steps**: Code is automatically segmented into logical sections

### When to Use

- Explaining complex algorithms step-by-step
- Demonstrating data flow through functions
- Teaching new syntax patterns
- Showing execution order of code

### Advanced: Custom Steps (Programmatic)

When using the component programmatically, you can provide custom steps with annotations:

```typescript
const steps: FlowStep[] = [
  {
    label: "Setup",
    description: "Initialize variables and state",
    highlight: [1, 2, 3],
    charRange: [0, 150],
    activeNode: "input",
    annotations: [
      "Type parameter T provides flexibility",
      "Constraint ensures type safety",
      "Return type matches input type"
    ]
  },
  // ... more steps
];
```

Set `showAnnotations={true}` to display the sidebar with bullet points.

---

## Comparison Directive

Shows side-by-side comparison of two approaches with an optional verdict.

### Syntax

```markdown
:::comparison[title="Mutable vs Immutable" left="Mutable" right="Immutable"]
LEFT:
```javascript
const arr = [1, 2, 3];
arr.push(4); // Mutates original
```

RIGHT:
```javascript
const arr = [1, 2, 3];
const newArr = [...arr, 4]; // Creates new array
```

VERDICT:
Prefer immutable operations for predictable state management.
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title for the comparison |
| `left` | No | Label for left side (default: "Before") |
| `right` | No | Label for right side (default: "After") |

### Sections

| Section | Required | Description |
|---------|----------|-------------|
| `LEFT:` | Yes | Content for left panel (styled red) |
| `RIGHT:` | Yes | Content for right panel (styled green) |
| `VERDICT:` | No | Summary/recommendation |

---

## Steps Directive

Displays numbered steps for tutorials or processes.

### Syntax

```markdown
:::steps[title="Setting Up Your Project"]
Step 1: Install Dependencies
Run `npm install` to install all required packages.

Step 2: Configure Environment
Create a `.env` file with your API keys.

Step 3: Start Development Server
Run `npm run dev` to start the local server.
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title for the steps block |

### Step Format

```
Step N: Title
Content for this step (supports markdown)
```

Steps are automatically numbered and styled with visual indicators.

---

## Pitfall Directive

Highlights common mistakes with wrong/correct examples and explanations.

### Syntax

```markdown
:::pitfall[title="Array Mutation in React State"]
WRONG:
```javascript
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // Direct mutation!
setItems(items);
```

RIGHT:
```javascript
const [items, setItems] = useState([1, 2, 3]);
setItems([...items, 4]); // Creates new array
```

WHY:
React uses reference equality to detect changes. Mutating the existing array keeps the same reference, so React won't re-render.
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title describing the pitfall |

### Sections

| Section | Required | Description |
|---------|----------|-------------|
| `WRONG:` | Yes | The incorrect approach (red styling) |
| `RIGHT:` | Yes | The correct approach (green styling) |
| `WHY:` | No | Explanation of why this matters |

---

## Real-World Directive

Provides practical, real-world context for concepts.

### Syntax

```markdown
:::realworld[title="E-commerce Search"]
Search functionality in online stores uses debouncing to prevent excessive API calls. As users type "running shoes", each keystroke would trigger a search without debouncing. With a 300ms debounce, the search only fires after the user pauses typing, reducing server load by 80% while maintaining responsive UX.
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title (default: "Real-World Example") |

---

## Deep Dive Directive

Collapsible section for advanced/optional content.

### Syntax

```markdown
:::deepdive[title="How V8 Optimizes This Pattern"]
V8's TurboFan compiler recognizes common patterns like array spreading and optimizes them at runtime. The spread operator `[...arr]` compiles to efficient native code when the array length is known at compile time...
:::
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `title` | No | Title (default: "Deep Dive") |

The content is collapsed by default. Users click to expand.

---

## Combining Directives

Directives can be used together to create rich lessons:

```markdown
## Understanding Generic Constraints

:::definition[title="Generic Constraint"]
A constraint limits what types can be used with a generic parameter.
:::

Here's how constraints work in practice:

:::animated[title="Constraint Flow" description="Type narrowing in action"]
```typescript
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}
```
:::

There are multiple ways to express this:

:::tabs[title="Constraint Styles"]
TAB: Inline
```typescript
function fn<T extends { id: number }>(item: T) {}
```
TAB: Interface
```typescript
interface HasId { id: number }
function fn<T extends HasId>(item: T) {}
```
:::

:::pitfall[title="Over-Constraining"]
WRONG:
```typescript
function fn<T extends string | number | boolean>(x: T) {}
```
RIGHT:
```typescript
function fn<T>(x: T) {} // Often sufficient
```
WHY:
Only add constraints when you need to access specific properties.
:::

:::tip
Start without constraints, add them only when TypeScript errors tell you to.
:::
```

---

## Best Practices

### 1. Choose the Right Directive

| Goal | Directive |
|------|-----------|
| Define a term | `:::definition` |
| Show multiple implementations | `:::tabs` |
| Animate code execution | `:::animated` |
| Compare approaches | `:::comparison` |
| Show common mistakes | `:::pitfall` |
| Sequential tutorial | `:::steps` |
| Advanced optional content | `:::deepdive` |
| Practical context | `:::realworld` |

### 2. Keep Content Focused

- Each directive should cover one concept
- Use animation sparingly for key concepts
- Limit tabs to 2-4 variants
- Keep step lists to 3-7 steps

### 3. Provide Context

- Use `description` attributes when available
- Include `title` for clarity
- Add `WHY:` sections in pitfalls
- Include `VERDICT:` in comparisons

### 4. Consider Mobile

- Tabs work well on mobile
- Animations may need fullscreen on small screens
- Comparisons stack vertically on mobile

---

## Component Files

These directives are implemented in:

- `src/app/forge/lesson/components/LessonMarkdown.tsx` - Main parser
- `src/app/forge/lesson/components/TabbedCode.tsx` - Tab component
- `src/app/forge/lesson/components/AnimatedCode.tsx` - Animation wrapper
- `src/app/forge/lesson/video-lab/variants/HybridVariant.tsx` - Core animation

---

## Future Extensions

Planned directives (not yet implemented):

- `:::quiz` - Interactive knowledge checks
- `:::playground` - Live code editor
- `:::timeline` - Historical/version timelines
- `:::diagram` - Mermaid diagram integration
