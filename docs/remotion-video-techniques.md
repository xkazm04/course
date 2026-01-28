# Remotion Video Techniques

This document describes the animated code walkthrough system used for generating educational programming videos. The system is designed to work with Remotion for rendering production-quality videos from lesson content.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [HybridVariant Component](#hybridvariant-component)
- [Flow Steps Configuration](#flow-steps-configuration)
- [Animation Features](#animation-features)
- [Annotation Sidebar](#annotation-sidebar)
- [Integration with Lessons](#integration-with-lessons)
- [Remotion Export Configuration](#remotion-export-configuration)
- [Best Practices](#best-practices)

---

## Overview

The video system creates animated code walkthroughs that:

1. **Type code character-by-character** with realistic timing
2. **Show shadow preview** of upcoming code for context
3. **Animate data flow** through Input → Process → Output diagrams
4. **Highlight active lines** to guide viewer attention
5. **Display annotations** explaining key benefits per step
6. **Auto-scroll** smoothly to follow the typing cursor

---

## Architecture

```
src/app/forge/lesson/
├── video-lab/
│   ├── page.tsx                    # Demo/preview page
│   └── variants/
│       ├── index.ts                # Exports
│       └── HybridVariant.tsx       # Main animation component
├── components/
│   ├── AnimatedCode.tsx            # Lesson-embedded wrapper
│   ├── TabbedCode.tsx              # Switchable code variants
│   └── LessonMarkdown.tsx          # Markdown parser
```

### Component Hierarchy

```
LessonMarkdown
  └── AnimatedCode (:::animated directive)
        └── HybridVariant
              ├── CompactFlowNode (x3: Input, Process, Output)
              ├── CodeLine (for each line)
              └── AnnotationSidebar (optional)
```

---

## HybridVariant Component

The core animation component that renders the video content.

### Props

```typescript
interface HybridVariantProps {
  code: string;              // The code to animate
  flowSteps: FlowStep[];     // Animation step configuration
  isPlaying: boolean;        // Play/pause state
  onComplete: () => void;    // Called when animation finishes
  title?: string;            // Filename shown in header
  showAnnotations?: boolean; // Show annotation sidebar
}
```

### Features

1. **Typewriter Animation**
   - Variable speed based on character type
   - Newlines: 80ms delay (pause effect)
   - Whitespace: 12ms (fast)
   - Brackets: 50ms (slightly slower)
   - Other: 30ms default

2. **Shadow Layer**
   - Full code visible as ghost text (15% opacity)
   - Provides context for what's coming
   - Uses dimmed syntax highlighting

3. **Data Flow Visualization**
   - Three-node diagram: Input → Process → Output
   - Nodes pulse when active
   - Values update per step
   - Gradient connection arrows

4. **Auto-Scroll**
   - Smooth eased scrolling (12% per frame)
   - Keeps cursor in view
   - Triggers only when cursor leaves viewport

---

## Flow Steps Configuration

Each step defines a segment of the animation.

### FlowStep Interface

```typescript
interface FlowStep {
  label: string;                    // Step name (e.g., "Setup")
  description: string;              // Explanation shown to user
  highlight: number[];              // Line numbers to highlight (1-indexed)
  charRange: [number, number];      // Character range to type [start, end]
  stateChanges?: Record<string, string>;  // Flow node value updates
  activeNode?: "input" | "process" | "output";  // Which node to activate
  annotations?: string[];           // Bullet points for sidebar
}
```

### Example Configuration

```typescript
const flowSteps: FlowStep[] = [
  {
    label: "Hook Setup",
    description: "Import dependencies and define the hook signature",
    highlight: [1, 2, 3, 4],
    charRange: [0, 200],
    stateChanges: { input: '""', timer: "null", output: '""' },
    activeNode: "input",
    annotations: [
      "Generic type T preserves input type",
      "Delay parameter controls timing",
      "Returns same type for type safety"
    ]
  },
  {
    label: "State Init",
    description: "Initialize state to hold the debounced value",
    highlight: [6, 7, 8],
    charRange: [200, 400],
    stateChanges: { input: "value", timer: "null", output: '""' },
    activeNode: "input",
    annotations: [
      "useState stores debounced value",
      "useRef tracks first render"
    ]
  },
  // ... more steps
];
```

### Calculating charRange

Character ranges must be calculated from the actual code:

```typescript
function calculateCharRanges(code: string): number[] {
  const lines = code.split('\n');
  const offsets = [0];
  let offset = 0;

  for (const line of lines) {
    offset += line.length + 1; // +1 for newline
    offsets.push(offset);
  }

  return offsets;
}

// Usage: charRange for lines 5-10
const offsets = calculateCharRanges(code);
const charRange = [offsets[4], offsets[10]]; // Lines are 0-indexed in offsets
```

---

## Animation Features

### Line Highlighting

Active lines receive visual emphasis:

```css
/* Highlight styling */
background: linear-gradient(to right,
  var(--ember)/10,
  var(--ember)/5,
  transparent
);
border-left: 2px solid var(--ember);
```

### Cursor Animation

Blinking cursor at the typing position:

```typescript
<motion.span
  className="w-[2px] h-[1.1em] bg-[var(--ember)]"
  animate={{ opacity: [1, 0] }}
  transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
/>
```

### Progress Bar

Shows overall animation progress:

```typescript
const overallProgress = (charIndex / totalChars) * 100;

<motion.div
  className="bg-gradient-to-r from-[var(--ember)] via-violet-500 to-emerald-500"
  animate={{ width: `${overallProgress}%` }}
/>
```

---

## Annotation Sidebar

Optional sidebar showing key benefits for each step.

### Enabling Annotations

```tsx
<HybridVariant
  code={code}
  flowSteps={stepsWithAnnotations}
  isPlaying={isPlaying}
  onComplete={onComplete}
  showAnnotations={true}  // Enable sidebar
/>
```

### Annotation Format

Each step can include 2-4 bullet points:

```typescript
{
  label: "Effect Logic",
  // ... other props
  annotations: [
    "useEffect reacts to value/delay changes",
    "First render check prevents unnecessary delay",
    "Early return pattern keeps code clean"
  ]
}
```

### Sidebar Features

- 224px fixed width
- Emerald bullet points
- Smooth transition between steps
- Current step indicator at bottom
- Header with "Key Benefits" label

---

## Integration with Lessons

### Markdown Directive

Use `:::animated` in lesson content:

```markdown
:::animated[title="useDebounce Hook" description="Custom hook implementation"]
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```
:::
```

### Auto-Generated Steps

When no custom steps are provided, AnimatedCode auto-generates them based on code structure:

1. **Import detection** → "Imports" step
2. **Function declaration** → "Function" step
3. **Type definition** → "Type Definition" step
4. **Return statement** → "Return" step
5. **Comments** → "Documentation" step

### AnimatedCode Props

```typescript
interface AnimatedCodeProps {
  code: string;
  title?: string;           // Default: "Code Walkthrough"
  description?: string;     // Subtitle text
  language?: string;        // Default: "typescript"
  steps?: FlowStep[];       // Custom steps (optional)
  className?: string;
  showAnnotations?: boolean; // Enable annotation sidebar
}
```

---

## Remotion Export Configuration

### Recommended Settings

```typescript
// remotion.config.ts
export const compositionConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 30 * 60, // 60 seconds default
};
```

### Export Command

```bash
npx remotion render src/remotion/index.tsx CodeWalkthrough out/video.mp4
```

### Dynamic Duration

Calculate frames from code length and typing speed:

```typescript
function calculateDuration(code: string, flowSteps: FlowStep[]): number {
  const avgCharsPerSecond = 25; // ~25 chars/sec average
  const stepPauseDuration = 1.2; // seconds pause between steps

  const typingTime = code.length / avgCharsPerSecond;
  const pauseTime = flowSteps.length * stepPauseDuration;

  return Math.ceil((typingTime + pauseTime) * 30); // Convert to frames at 30fps
}
```

---

## Best Practices

### Code Selection

1. **Keep code focused** - 20-50 lines ideal
2. **Include comments** - They become natural pause points
3. **Structure logically** - Group related lines for highlighting
4. **Use real examples** - Production-like code is more engaging

### Step Design

1. **3-6 steps optimal** - Too many feels rushed
2. **Logical groupings** - Setup → Logic → Result flow
3. **Clear descriptions** - One concept per step
4. **Meaningful highlights** - Only highlight what you're explaining

### Annotations

1. **2-4 bullets per step** - Keep it scannable
2. **Action-oriented** - Start with verbs when possible
3. **Benefit-focused** - Why this matters, not just what it does
4. **Progressive depth** - Simple → technical as steps progress

### Performance

1. **Memoize tokenization** - `useMemo` for syntax highlighting
2. **Debounce scroll** - Use requestAnimationFrame
3. **Lazy render** - Only render visible + buffer lines
4. **Cleanup animations** - Clear timeouts on unmount

---

## Future Enhancements

### Planned Features

1. **Voice narration sync** - TTS or recorded audio aligned to steps
2. **Interactive mode** - Click to advance instead of auto-play
3. **Export presets** - YouTube, Twitter, Instagram formats
4. **Custom themes** - Dark/light, branded colors
5. **Diff visualization** - Show code changes between steps

### Extension Points

The component is designed for extension:

```typescript
// Custom flow node types
const CUSTOM_NODE_CONFIGS = {
  ...NODE_CONFIGS,
  database: {
    icon: DatabaseIcon,
    label: "DB",
    gradient: "from-blue-500 to-cyan-500",
    // ...
  }
};

// Custom syntax themes
const DARK_THEME_COLORS: Record<TokenType, string> = {
  keyword: "text-purple-400",
  // ...
};
```

---

## Component Reference

### Files

| File | Purpose |
|------|---------|
| `HybridVariant.tsx` | Core animation component |
| `AnimatedCode.tsx` | Lesson-embedded wrapper |
| `video-lab/page.tsx` | Development preview page |

### CSS Variables

```css
--ember: #f97316;           /* Primary accent */
--forge-bg-void: #0a0a0f;   /* Dark background */
--forge-text-primary: #fff; /* Primary text */
```

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useState(charIndex)` | Current typing position |
| `useState(currentStep)` | Active step index |
| `useRef(scrollTarget)` | Smooth scroll target |
| `useMemo(tokenizedLines)` | Cached syntax highlighting |
