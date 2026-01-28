/**
 * Example Lesson Content - Closures Explained
 *
 * Demonstrates the lesson content structure with rich custom markdown blocks.
 * Showcases all extended block types for maximum content depth.
 */

import type { FullLesson, LessonContent, LessonSection } from "./types";

// ============================================================================
// Example: Closures Explained (from JavaScript Mastery > Functions Deep Dive)
// ============================================================================

export const EXAMPLE_LESSON_CONTENT: LessonContent = {
    id: "example-closures-explained",
    node_id: "closures-explained-node-id",
    version: 1,
    status: "published",
    introduction: `**Closures** are one of the most powerful yet misunderstood concepts in JavaScript. A closure is created when a function "remembers" the variables from its outer scope, even after that outer function has finished executing.

Understanding closures unlocks patterns like:
- Private variables and encapsulation
- Factory functions and currying
- Event handlers that preserve state
- Module patterns for code organization`,

    content_markdown: `## What is a Closure?

A closure is a function bundled together with references to its surrounding state (the **lexical environment**). In simpler terms, a closure gives you access to an outer function's scope from an inner function.

:::definition[title="Closure"]
A **closure** is the combination of a function and the lexical environment within which that function was declared. Every function in JavaScript forms a closure at creation time.
:::

:::code[language="javascript" title="Basic Closure Example"]
function createGreeter(greeting) {
  return function(name) {
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = createGreeter("Hello");
console.log(sayHello("Alice")); // "Hello, Alice!"
:::

:::keypoints
- Closures capture variables from their lexical scope
- They enable private variables and encapsulation
- Function factories use closures for specialization
- Watch out for loop closure bugs—use let or IIFEs
:::`,

    metadata: {
        estimated_minutes: 25,
        difficulty: "intermediate",
        key_takeaways: [
            "Closures capture variables from their surrounding scope",
            "They enable private variables and encapsulation",
            "Function factories use closures to create specialized functions",
            "The classic loop bug is solved with let or IIFEs",
            "Be mindful of memory with long-lived closures",
        ],
        key_references: [
            {
                title: "MDN: Closures",
                url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
                type: "docs",
            },
            {
                title: "JavaScript.info",
                url: "https://javascript.info/closure",
                type: "article",
            },
            {
                title: "You Don't Know JS",
                url: "https://github.com/getify/You-Dont-Know-JS",
                type: "repo",
            },
            {
                title: "JS Visualizer 9000",
                url: "https://www.jsv9000.app/",
                type: "tool",
            },
        ],
        video_variants: [
            {
                id: "fireship-closures",
                title: "Closures in 100 Seconds",
                youtube_id: "vKJpN5FAeF4",
                search_query: "javascript closures explained",
                instructor: "Fireship",
                style: "animated",
                duration: "2:30",
            },
            {
                id: "traversy-closures",
                title: "JavaScript Closures Tutorial",
                search_query: "javascript closures tutorial traversy media",
                instructor: "Traversy Media",
                style: "tutorial",
                duration: "15:00",
            },
            {
                id: "academind-closures",
                title: "JavaScript Closures - A Deep Dive",
                search_query: "javascript closures academind",
                instructor: "Academind",
                style: "lecture",
                duration: "25:00",
            },
        ],
        tags: ["javascript", "closures", "scope", "functions", "intermediate"],
    },

    is_ai_generated: false,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

export const EXAMPLE_LESSON_SECTIONS: LessonSection[] = [
    {
        id: "section-1-what-is",
        sort_order: 1,
        title: "Understanding Closures",
        section_type: "lesson",
        duration_minutes: 5,
        content_markdown: `A closure is a function bundled together with references to its surrounding state. When a function is created inside another function, it captures variables from the outer scope.

This concept is fundamental to JavaScript and enables powerful patterns like private variables, factories, and modules.

:::definition[title="Lexical Scope"]
JavaScript uses **lexical scoping**, meaning a function's scope is determined by where it's written in the code, not where it's called from. Inner functions have access to variables in their outer functions.
:::

:::tabs
## JavaScript [javascript]
function outer() {
  const message = "Hello";
  function inner() {
    console.log(message); // Can access outer's variable
  }
  return inner;
}

const fn = outer();
fn(); // "Hello" - closure preserves access!

## Python [python]
def outer():
    message = "Hello"
    def inner():
        print(message)  # Can access outer's variable
    return inner

fn = outer()
fn()  # "Hello" - Python also has closures!

## TypeScript [typescript]
function outer(): () => void {
  const message: string = "Hello";
  function inner(): void {
    console.log(message); // Type-safe closure
  }
  return inner;
}

const fn = outer();
fn(); // "Hello"
:::

:::checkpoint[question="What makes a closure different from a regular function?" hint="Think about what happens to the outer function's variables"]
A closure is a function that retains access to variables from its outer scope even after the outer function has finished executing. Regular functions don't necessarily capture their surrounding state - closures specifically "remember" their lexical environment.
:::`,
        key_points: [
            "Closures capture the lexical environment",
            "Every function in JavaScript forms a closure",
            "Inner functions can access outer function variables",
        ],
    },
    {
        id: "section-2-how-work",
        sort_order: 2,
        title: "How Closures Work",
        section_type: "lesson",
        duration_minutes: 6,
        content_markdown: `When a function is defined, it keeps a reference to all variables in its scope chain. This reference persists even after the outer function completes execution.

The key insight is that closures capture variables **by reference**, not by value. This means if the outer variable changes, the closure sees the new value.

:::comparison[title="Variable Capture" left="By Value (Not how closures work)" right="By Reference (How closures actually work)"]
LEFT:
// If closures captured by value...
function createCounter() {
  let count = 0;
  return () => count; // Would copy 0
}
const get = createCounter();
// count changes wouldn't affect get()

RIGHT:
// Closures capture by reference
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    get: () => count
  };
}
const counter = createCounter();
counter.increment(); // count is now 1
counter.get(); // Returns 1 (sees the change!)

VERDICT:
Understanding that closures capture by reference explains why all iterations in a var loop share the same value, and why mutations are visible across all closures sharing a variable.
:::

:::steps[title="Creating a Closure Step-by-Step"]
## Define the Outer Function
Create a function that contains the variables you want to capture. These variables will be available to inner functions.

\`\`\`javascript
function createGreeter(greeting) {
  // 'greeting' will be captured
}
\`\`\`

## Create the Inner Function
Define a function inside the outer function. This inner function automatically captures the outer scope.

\`\`\`javascript
function createGreeter(greeting) {
  return function(name) {
    // Has access to 'greeting' from outer scope
    return \`\${greeting}, \${name}!\`;
  };
}
\`\`\`

## Return and Use the Closure
Return the inner function. Even after the outer function completes, the inner function retains access to captured variables.

\`\`\`javascript
const sayHello = createGreeter("Hello");
const sayHi = createGreeter("Hi");

sayHello("Alice"); // "Hello, Alice!"
sayHi("Bob");      // "Hi, Bob!"
// Each closure has its own 'greeting'!
\`\`\`
:::

:::protip[author="Kyle Simpson"]
Closure is when a function "remembers" its lexical scope even when the function is executed outside that lexical scope. This is the mental model that helps most developers truly understand closures.
:::`,
        code_snippet: `function createGreeter(greeting) {
  // 'greeting' is captured by the inner function
  return function(name) {
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = createGreeter("Hello");
const sayHi = createGreeter("Hi");

console.log(sayHello("Alice")); // "Hello, Alice!"
console.log(sayHi("Bob"));      // "Hi, Bob!"`,
        code_language: "javascript",
        key_points: [
            "Functions keep references to outer variables",
            "Each closure has its own captured environment",
            "Variables are captured by reference, not value",
        ],
    },
    {
        id: "section-3-patterns",
        sort_order: 3,
        title: "Practical Patterns",
        section_type: "interactive",
        duration_minutes: 10,
        content_markdown: `Closures enable several important patterns in JavaScript. Let's explore each one with practical examples.

:::scenario[title="When to Use Closures"]
Closures are the right choice in many scenarios. Understanding when to use them will make your code more elegant and maintainable.

USE WHEN:
- You need private variables that can't be accessed externally
- Creating function factories that produce specialized functions
- Implementing the module pattern for code organization
- Preserving state across multiple function calls
- Creating callbacks that need access to surrounding context

AVOID WHEN:
- Simple pure functions with no state requirements
- Performance-critical code with many short-lived closures
- When a class would be more readable for complex state management

EXAMPLE:
// Perfect use case: rate limiter
function createRateLimiter(maxCalls, period) {
  let calls = 0;
  setInterval(() => calls = 0, period);

  return function(fn) {
    if (calls < maxCalls) {
      calls++;
      return fn();
    }
    throw new Error('Rate limit exceeded');
  };
}
:::

:::realworld[title="React useState Hook"]
React's useState hook is implemented using closures. Understanding this helps you debug state issues.

\`\`\`javascript
// Simplified useState implementation
let state;
let stateIndex = 0;

function useState(initialValue) {
  const currentIndex = stateIndex;
  state[currentIndex] = state[currentIndex] ?? initialValue;

  const setState = (newValue) => {
    state[currentIndex] = newValue; // Closure captures currentIndex
    rerender();
  };

  stateIndex++;
  return [state[currentIndex], setState];
}

// Each useState call gets its own closure with its own index!
const [count, setCount] = useState(0);
const [name, setName] = useState("");
\`\`\`

This is why hooks must be called in the same order every render - each hook relies on its closure capturing the correct index!
:::

:::syntax[name="createPrivateCounter"]
Creates a counter with private state that cannot be accessed directly.

SIGNATURE:
function createPrivateCounter(initial?: number): Counter

PARAMETERS:
- initial?: number - Starting value for the counter (default: 0)

RETURNS:
Counter - Object with increment, decrement, and getCount methods

EXAMPLES:
\`\`\`javascript
const counter = createPrivateCounter(10);
counter.increment(); // 11
counter.decrement(); // 10
counter.getCount();  // 10
counter.count;       // undefined (private!)
\`\`\`

\`\`\`javascript
// Multiple independent counters
const a = createPrivateCounter();
const b = createPrivateCounter(100);
a.increment(); // 1
b.increment(); // 101
\`\`\`
:::`,
        code_snippet: `// Private variable pattern
function createCounter() {
  let count = 0; // Private - can't access from outside!

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount());  // 2
console.log(counter.count);       // undefined (private!)`,
        code_language: "javascript",
        key_points: [
            "Private variables via closure scope",
            "Factory functions create specialized closures",
            "Module pattern organizes public/private code",
        ],
    },
    {
        id: "section-4-pitfalls",
        sort_order: 4,
        title: "Common Pitfalls",
        section_type: "lesson",
        duration_minutes: 6,
        content_markdown: `The classic closure pitfall involves loops and \`var\` declarations. Since \`var\` is function-scoped (not block-scoped), all iterations share the same variable.

:::pitfall[title="The Loop Closure Bug"]
Creating closures inside a loop with var causes all closures to share the same variable. This is one of the most common JavaScript bugs.

WRONG:
\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (not 0, 1, 2!)
\`\`\`

RIGHT:
\`\`\`javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (let creates new binding each iteration)
\`\`\`

WHY:
With var, there's only ONE i variable for the entire function. By the time setTimeout callbacks run, the loop has finished and i equals 3. With let, each iteration gets its own i binding, so each closure captures a different value.
:::

:::tabs
## The Bug Explained [javascript]
// var is function-scoped, not block-scoped
for (var i = 0; i < 3; i++) {
  // All 3 callbacks reference THE SAME 'i'
  setTimeout(() => console.log(i), 100);
}
// When callbacks run, loop is done, i = 3
// Output: 3, 3, 3

## Fix 1: Use let [javascript]
// let is block-scoped - each iteration gets its own 'i'
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2

## Fix 2: IIFE [javascript]
// Create a new scope manually with IIFE
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2

## Fix 3: forEach [javascript]
// Array methods create a new scope per callback
[0, 1, 2].forEach(i => {
  setTimeout(() => console.log(i), 100);
});
// Output: 0, 1, 2
:::

:::warning[title="Memory Leaks"]
Closures can cause memory leaks if they hold references to large objects that are no longer needed. Be especially careful with event listeners and long-lived callbacks.
:::

:::deepdive[title="Understanding the Event Loop Connection"]
The loop closure bug is deeply connected to JavaScript's event loop. Here's what happens:

1. The for loop runs synchronously, creating 3 setTimeout calls
2. Each setTimeout schedules its callback for ~100ms later
3. The loop completes before any callback runs (i is now 3)
4. 100ms later, callbacks execute - they look up 'i' and find 3

With let:
1. Each iteration creates a new lexical environment
2. Each callback's closure captures its own copy of i
3. When callbacks run, each finds its own captured value

This is why understanding the event loop is crucial for JavaScript developers - async behavior interacts with closures in surprising ways!
:::`,
        code_snippet: `// ❌ Bug: All callbacks log '3'
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (not 0, 1, 2!)

// ✅ Fix 1: Use let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2

// ✅ Fix 2: IIFE creates new scope
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2`,
        code_language: "javascript",
        key_points: [
            "var is function-scoped, not block-scoped",
            "Use let to create per-iteration scope",
            "IIFEs can also solve the loop problem",
        ],
    },
];

export const EXAMPLE_FULL_LESSON: FullLesson = {
    content: EXAMPLE_LESSON_CONTENT,
    sections: EXAMPLE_LESSON_SECTIONS,
    node: {
        id: "closures-explained-node-id",
        slug: "closures-explained",
        name: "Closures Explained",
        description: "Understanding closures and their practical applications",
        depth: 4,
        parent_id: "scope-closures-area-id",
        domain_id: "frontend",
    },
    breadcrumbs: {
        domain: "Frontend Development",
        topic: "JavaScript Mastery",
        skill: "Functions Deep Dive",
        area: "Scope and Closures",
    },
};
