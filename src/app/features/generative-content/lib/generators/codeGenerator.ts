/**
 * Code Example Generator
 * Generates progressive code examples with step-by-step explanations
 */

import type {
    LearningPathSeed,
    ContentGenerationParams,
    ProgressiveCodeExample,
    GeneratedChapterSection,
} from "../types";
import type { SectionType } from "@/app/features/chapter/lib/chapterData";
import { capitalize, getFileExtension, generateFilename, generateExpectedOutput } from "./helpers";

/**
 * Generate progressive code examples for a section
 */
export function generateCodeExamples(
    topic: string,
    sectionId: string,
    sectionType: SectionType,
    params: ContentGenerationParams,
    previousSections: GeneratedChapterSection[]
): ProgressiveCodeExample[] {
    const language = params.codeLanguage || "typescript";
    const examples: ProgressiveCodeExample[] = [];

    // Get previous code context for progressive building
    const previousCode = previousSections
        .flatMap((s) => s.codeExamples)
        .map((e) => e?.finalCode)
        .filter(Boolean)
        .join("\n\n");

    // Generate main example
    const mainExample = generateMainCodeExample(topic, sectionId, language, params, previousCode);
    examples.push(mainExample);

    // For interactive sections, add a challenge example
    if (sectionType === "interactive" || sectionType === "exercise") {
        const challengeExample = generateChallengeCodeExample(topic, sectionId, language, params);
        examples.push(challengeExample);
    }

    return examples;
}

/**
 * Generate main code example with progressive steps
 */
function generateMainCodeExample(
    topic: string,
    sectionId: string,
    language: string,
    params: ContentGenerationParams,
    previousCode: string
): ProgressiveCodeExample {
    const allTopics = params.pathSeed.topics;
    const filename = generateFilename(topic, language);
    const steps = generateCodeSteps(topic, language, allTopics, params.pathSeed.skillLevel);

    return {
        id: `${sectionId}_main_example`,
        title: `${topic} Example`,
        language,
        filename,
        steps,
        finalCode: steps[steps.length - 1]?.code || "",
        expectedOutput: generateExpectedOutput(topic, language),
    };
}

/**
 * Generate code steps that build progressively
 */
function generateCodeSteps(
    topic: string,
    language: string,
    allTopics: string[],
    skillLevel: LearningPathSeed["skillLevel"]
): ProgressiveCodeExample["steps"] {
    const topicLower = topic.toLowerCase();

    if (language === "typescript" || language === "javascript") {
        return generateTypeScriptSteps(topicLower, allTopics, skillLevel);
    } else if (language === "python") {
        return generatePythonSteps(topicLower, allTopics, skillLevel);
    }

    return generateGenericSteps(topic, language, skillLevel);
}

/**
 * Generate TypeScript/JavaScript code steps
 */
function generateTypeScriptSteps(
    topic: string,
    allTopics: string[],
    skillLevel: LearningPathSeed["skillLevel"]
): ProgressiveCodeExample["steps"] {
    const isReactRelated = allTopics.some((t) => t.toLowerCase().includes("react"));
    const isApiRelated = allTopics.some((t) =>
        ["api", "graphql", "rest", "fetch"].some((k) => t.toLowerCase().includes(k))
    );

    if (isReactRelated && topic.includes("hook")) {
        return generateReactHookSteps(topic);
    }

    if (isApiRelated) {
        return generateApiClientSteps(topic);
    }

    return generateGenericSteps(topic, "typescript", skillLevel);
}

/**
 * Generate React hook code steps
 */
function generateReactHookSteps(topic: string): ProgressiveCodeExample["steps"] {
    const hookName = capitalize(topic.replace(/\s+/g, ""));

    return [
        {
            stepIndex: 0,
            explanation: "Start by importing the necessary React hooks",
            code: `import { useState, useEffect } from 'react';`,
            linesAdded: [1],
        },
        {
            stepIndex: 1,
            explanation: "Define the custom hook function with proper typing",
            code: `import { useState, useEffect } from 'react';

// Custom hook for ${topic}
export function use${hookName}() {
  // Hook implementation goes here
}`,
            linesAdded: [3, 4, 5, 6],
        },
        {
            stepIndex: 2,
            explanation: "Add state management with useState",
            code: `import { useState, useEffect } from 'react';

// Custom hook for ${topic}
export function use${hookName}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Effect will go here

  return { data, loading, error };
}`,
            linesAdded: [5, 6, 7, 11],
            linesModified: [4],
        },
        {
            stepIndex: 3,
            explanation: "Implement the useEffect for data fetching or side effects",
            code: `import { useState, useEffect } from 'react';

// Custom hook for ${topic}
export function use${hookName}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulated async operation
        const result = await new Promise(resolve =>
          setTimeout(() => resolve({ value: 'Example data' }), 1000)
        );
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}`,
            linesAdded: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
        },
    ];
}

/**
 * Generate API client code steps
 */
function generateApiClientSteps(topic: string): ProgressiveCodeExample["steps"] {
    return [
        {
            stepIndex: 0,
            explanation: "Set up the API client with proper typing",
            code: `// API client setup
interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}`,
            linesAdded: [1, 2, 3, 4, 5],
        },
        {
            stepIndex: 1,
            explanation: "Create the base fetch function with error handling",
            code: `// API client setup
interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  config: ApiConfig,
  options?: RequestInit
): Promise<T> {
  const url = \`\${config.baseUrl}\${endpoint}\`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return response.json();
}`,
            linesAdded: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        },
        {
            stepIndex: 2,
            explanation: "Add helper methods for common HTTP operations",
            code: `// API client setup
interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  config: ApiConfig,
  options?: RequestInit
): Promise<T> {
  const url = \`\${config.baseUrl}\${endpoint}\`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return response.json();
}

// Helper methods
export const createApiClient = (config: ApiConfig) => ({
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, config),
  post: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, config, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, config, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, config, { method: 'DELETE' }),
});`,
            linesAdded: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
        },
    ];
}

/**
 * Generate Python code steps
 */
function generatePythonSteps(
    topic: string,
    allTopics: string[],
    skillLevel: LearningPathSeed["skillLevel"]
): ProgressiveCodeExample["steps"] {
    const className = capitalize(topic.replace(/\s+/g, ""));

    return [
        {
            stepIndex: 0,
            explanation: "Import required modules",
            code: `# ${capitalize(topic)} implementation
from typing import Optional, List, Dict
from dataclasses import dataclass`,
            linesAdded: [1, 2, 3],
        },
        {
            stepIndex: 1,
            explanation: "Define the data model",
            code: `# ${capitalize(topic)} implementation
from typing import Optional, List, Dict
from dataclasses import dataclass

@dataclass
class ${className}Config:
    """Configuration for ${topic}"""
    name: str
    options: Dict[str, any] = None
    enabled: bool = True`,
            linesAdded: [5, 6, 7, 8, 9, 10],
        },
        {
            stepIndex: 2,
            explanation: "Implement the main class",
            code: `# ${capitalize(topic)} implementation
from typing import Optional, List, Dict
from dataclasses import dataclass

@dataclass
class ${className}Config:
    """Configuration for ${topic}"""
    name: str
    options: Dict[str, any] = None
    enabled: bool = True

class ${className}:
    """Main implementation for ${topic}"""

    def __init__(self, config: ${className}Config):
        self.config = config
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize the ${topic} system"""
        if self._initialized:
            return True
        # Initialization logic here
        self._initialized = True
        return True

    def process(self, data: any) -> any:
        """Process data using ${topic}"""
        if not self._initialized:
            self.initialize()
        # Processing logic here
        return data`,
            linesAdded: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
        },
    ];
}

/**
 * Generate generic code steps for other languages
 */
function generateGenericSteps(
    topic: string,
    language: string,
    skillLevel: LearningPathSeed["skillLevel"]
): ProgressiveCodeExample["steps"] {
    return [
        {
            stepIndex: 0,
            explanation: `Setting up the basic structure for ${topic}`,
            code: `// ${topic} - Step 1: Basic Setup
// Language: ${language}

// Define the main structure`,
            linesAdded: [1, 2, 3, 4],
        },
        {
            stepIndex: 1,
            explanation: `Implementing core functionality for ${topic}`,
            code: `// ${topic} - Step 2: Core Implementation
// Language: ${language}

// Core implementation here
function main() {
  // Initialize ${topic}
  console.log("${topic} initialized");
}`,
            linesAdded: [5, 6, 7, 8],
            linesModified: [4],
        },
    ];
}

/**
 * Generate challenge code example
 */
function generateChallengeCodeExample(
    topic: string,
    sectionId: string,
    language: string,
    params: ContentGenerationParams
): ProgressiveCodeExample {
    const challengeCode = `// Challenge: Implement ${topic}
// TODO: Your code here

function challenge() {
  // Implement the solution
}`;

    return {
        id: `${sectionId}_challenge`,
        title: `${topic} Challenge`,
        language,
        filename: `challenge_${topic.toLowerCase().replace(/\s+/g, "_")}.${getFileExtension(language)}`,
        steps: [
            {
                stepIndex: 0,
                explanation: "Here's your challenge! Complete the implementation below.",
                code: challengeCode,
                linesAdded: [1, 2, 3, 4, 5, 6],
            },
        ],
        finalCode: challengeCode,
        expectedOutput: "// Complete the challenge to see the expected output",
    };
}
