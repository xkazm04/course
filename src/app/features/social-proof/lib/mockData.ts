/**
 * Mock Data for Social Proof Visualization
 *
 * Contains realistic anonymized learner journey data that demonstrates
 * various paths through the knowledge graph.
 */

import type {
  LearnerJourney,
  PathStats,
  FilterOption,
  LearnerStartingPoint,
} from "./types";

/**
 * Generate a realistic learner journey through the knowledge graph
 */
export const mockLearnerJourneys: LearnerJourney[] = [
  {
    id: "journey-001",
    profileLabel: "Alex M.",
    startingPoint: "beginner",
    outcome: "senior-engineer",
    durationMonths: 8,
    pathColor: "#6366f1", // Indigo
    activityLevel: 0.95,
    testimonial: "From zero coding experience to senior engineer at a startup",
    nodes: [
      { id: "html-basics", name: "HTML Basics", color: "#f97316", x: 10, y: 50, duration: 1 },
      { id: "css-fundamentals", name: "CSS Fundamentals", color: "#f97316", x: 18, y: 45, duration: 1 },
      { id: "js-basics", name: "JavaScript Basics", color: "#eab308", x: 28, y: 40, duration: 2, isMilestone: true },
      { id: "react-intro", name: "React Introduction", color: "#22c55e", x: 40, y: 35, duration: 2 },
      { id: "state-mgmt", name: "State Management", color: "#22c55e", x: 52, y: 30, duration: 1 },
      { id: "typescript", name: "TypeScript", color: "#3b82f6", x: 62, y: 32, duration: 1, isMilestone: true },
      { id: "testing", name: "Testing", color: "#8b5cf6", x: 72, y: 38, duration: 1 },
      { id: "system-design", name: "System Design", color: "#ec4899", x: 85, y: 45, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-002",
    profileLabel: "Sarah K.",
    startingPoint: "career-switcher",
    previousField: "Finance",
    outcome: "data-scientist",
    durationMonths: 10,
    pathColor: "#10b981", // Emerald
    activityLevel: 0.88,
    testimonial: "Transitioned from financial analyst to ML engineer",
    nodes: [
      { id: "python-basics", name: "Python Basics", color: "#eab308", x: 12, y: 55, duration: 2 },
      { id: "data-structures", name: "Data Structures", color: "#f97316", x: 22, y: 48, duration: 2, isMilestone: true },
      { id: "statistics", name: "Statistics", color: "#3b82f6", x: 32, y: 42, duration: 2 },
      { id: "pandas-numpy", name: "Pandas & NumPy", color: "#22c55e", x: 45, y: 38, duration: 1 },
      { id: "ml-basics", name: "ML Fundamentals", color: "#8b5cf6", x: 58, y: 35, duration: 2, isMilestone: true },
      { id: "deep-learning", name: "Deep Learning", color: "#ec4899", x: 72, y: 40, duration: 2 },
      { id: "ml-ops", name: "MLOps", color: "#6366f1", x: 88, y: 48, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-003",
    profileLabel: "Jordan T.",
    startingPoint: "bootcamp-graduate",
    outcome: "fullstack-developer",
    durationMonths: 5,
    pathColor: "#f59e0b", // Amber
    activityLevel: 0.92,
    testimonial: "Filled the gaps bootcamp left - now leading a team",
    nodes: [
      { id: "algorithms", name: "Algorithms", color: "#f97316", x: 15, y: 52, duration: 1, isMilestone: true },
      { id: "databases", name: "Databases", color: "#3b82f6", x: 28, y: 45, duration: 1 },
      { id: "node-advanced", name: "Node.js Advanced", color: "#22c55e", x: 42, y: 38, duration: 1 },
      { id: "api-design", name: "API Design", color: "#8b5cf6", x: 55, y: 42, duration: 1, isMilestone: true },
      { id: "docker-k8s", name: "Docker & K8s", color: "#ec4899", x: 70, y: 48, duration: 1 },
      { id: "ci-cd", name: "CI/CD", color: "#6366f1", x: 85, y: 52, duration: 0.5, isMilestone: true },
    ],
  },
  {
    id: "journey-004",
    profileLabel: "Morgan L.",
    startingPoint: "self-taught",
    outcome: "frontend-engineer",
    durationMonths: 6,
    pathColor: "#ec4899", // Pink
    activityLevel: 0.85,
    testimonial: "Structured my scattered knowledge into real expertise",
    nodes: [
      { id: "js-deep-dive", name: "JS Deep Dive", color: "#eab308", x: 12, y: 48, duration: 2, isMilestone: true },
      { id: "css-advanced", name: "CSS Advanced", color: "#f97316", x: 25, y: 42, duration: 1 },
      { id: "react-patterns", name: "React Patterns", color: "#22c55e", x: 38, y: 38, duration: 1 },
      { id: "performance", name: "Web Performance", color: "#3b82f6", x: 52, y: 35, duration: 1, isMilestone: true },
      { id: "accessibility", name: "Accessibility", color: "#8b5cf6", x: 68, y: 40, duration: 1 },
      { id: "design-systems", name: "Design Systems", color: "#ec4899", x: 82, y: 45, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-005",
    profileLabel: "Taylor R.",
    startingPoint: "intermediate",
    outcome: "tech-lead",
    durationMonths: 12,
    pathColor: "#8b5cf6", // Violet
    activityLevel: 0.78,
    testimonial: "Went from IC to tech lead with a focus on architecture",
    nodes: [
      { id: "system-patterns", name: "System Patterns", color: "#f97316", x: 10, y: 50, duration: 2 },
      { id: "microservices", name: "Microservices", color: "#eab308", x: 22, y: 45, duration: 2, isMilestone: true },
      { id: "event-driven", name: "Event-Driven", color: "#22c55e", x: 35, y: 40, duration: 2 },
      { id: "security", name: "Security", color: "#3b82f6", x: 48, y: 38, duration: 1 },
      { id: "team-leadership", name: "Team Leadership", color: "#8b5cf6", x: 62, y: 42, duration: 2, isMilestone: true },
      { id: "tech-strategy", name: "Tech Strategy", color: "#ec4899", x: 78, y: 48, duration: 2 },
      { id: "mentoring", name: "Mentoring", color: "#6366f1", x: 90, y: 52, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-006",
    profileLabel: "Casey W.",
    startingPoint: "career-switcher",
    previousField: "Marketing",
    outcome: "product-engineer",
    durationMonths: 9,
    pathColor: "#06b6d4", // Cyan
    activityLevel: 0.9,
    testimonial: "Combined my marketing background with new dev skills",
    nodes: [
      { id: "web-basics", name: "Web Basics", color: "#f97316", x: 8, y: 52, duration: 2 },
      { id: "js-modern", name: "Modern JavaScript", color: "#eab308", x: 20, y: 46, duration: 2, isMilestone: true },
      { id: "react-basics", name: "React Basics", color: "#22c55e", x: 35, y: 40, duration: 2 },
      { id: "product-analytics", name: "Product Analytics", color: "#3b82f6", x: 50, y: 36, duration: 1 },
      { id: "a-b-testing", name: "A/B Testing", color: "#8b5cf6", x: 62, y: 38, duration: 1, isMilestone: true },
      { id: "growth-eng", name: "Growth Engineering", color: "#ec4899", x: 75, y: 44, duration: 1 },
      { id: "full-product", name: "Full Product Dev", color: "#6366f1", x: 88, y: 50, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-007",
    profileLabel: "Riley P.",
    startingPoint: "beginner",
    outcome: "devops-engineer",
    durationMonths: 11,
    pathColor: "#14b8a6", // Teal
    activityLevel: 0.82,
    testimonial: "Started curious about automation, now I run infrastructure",
    nodes: [
      { id: "linux-basics", name: "Linux Basics", color: "#f97316", x: 10, y: 48, duration: 2, isMilestone: true },
      { id: "bash-scripting", name: "Bash Scripting", color: "#eab308", x: 22, y: 44, duration: 1 },
      { id: "networking", name: "Networking", color: "#22c55e", x: 32, y: 40, duration: 2 },
      { id: "cloud-aws", name: "AWS Cloud", color: "#3b82f6", x: 45, y: 36, duration: 2, isMilestone: true },
      { id: "terraform", name: "Terraform", color: "#8b5cf6", x: 58, y: 38, duration: 1 },
      { id: "containers", name: "Containers", color: "#ec4899", x: 70, y: 42, duration: 2 },
      { id: "k8s-advanced", name: "K8s Advanced", color: "#6366f1", x: 85, y: 48, duration: 1, isMilestone: true },
    ],
  },
  {
    id: "journey-008",
    profileLabel: "Jamie H.",
    startingPoint: "bootcamp-graduate",
    outcome: "senior-engineer",
    durationMonths: 7,
    pathColor: "#a855f7", // Purple
    activityLevel: 0.94,
    testimonial: "Bootcamp taught me to code, this taught me to engineer",
    nodes: [
      { id: "cs-fundamentals", name: "CS Fundamentals", color: "#f97316", x: 12, y: 50, duration: 2, isMilestone: true },
      { id: "oop-patterns", name: "OOP Patterns", color: "#eab308", x: 26, y: 44, duration: 1 },
      { id: "clean-code", name: "Clean Code", color: "#22c55e", x: 40, y: 40, duration: 1 },
      { id: "architecture", name: "Architecture", color: "#3b82f6", x: 52, y: 38, duration: 2, isMilestone: true },
      { id: "testing-adv", name: "Advanced Testing", color: "#8b5cf6", x: 65, y: 42, duration: 1 },
      { id: "code-review", name: "Code Review", color: "#ec4899", x: 78, y: 46, duration: 0.5 },
      { id: "senior-skills", name: "Senior Skills", color: "#6366f1", x: 90, y: 50, duration: 0.5, isMilestone: true },
    ],
  },
];

/**
 * Filter options for starting point selection
 */
export const startingPointFilters: FilterOption[] = [
  {
    id: "all",
    label: "All Paths",
    value: "beginner" as LearnerStartingPoint, // Default, but we'll handle "all" specially
    icon: "🌐",
    count: mockLearnerJourneys.length,
  },
  {
    id: "beginner",
    label: "Complete Beginner",
    value: "beginner",
    icon: "🌱",
    count: mockLearnerJourneys.filter((j) => j.startingPoint === "beginner").length,
  },
  {
    id: "career-switcher",
    label: "Career Switcher",
    value: "career-switcher",
    icon: "🔄",
    count: mockLearnerJourneys.filter((j) => j.startingPoint === "career-switcher").length,
  },
  {
    id: "bootcamp-graduate",
    label: "Bootcamp Graduate",
    value: "bootcamp-graduate",
    icon: "🎓",
    count: mockLearnerJourneys.filter((j) => j.startingPoint === "bootcamp-graduate").length,
  },
  {
    id: "self-taught",
    label: "Self-Taught",
    value: "self-taught",
    icon: "📚",
    count: mockLearnerJourneys.filter((j) => j.startingPoint === "self-taught").length,
  },
  {
    id: "intermediate",
    label: "Intermediate",
    value: "intermediate",
    icon: "⚡",
    count: mockLearnerJourneys.filter((j) => j.startingPoint === "intermediate").length,
  },
];

/**
 * Calculate statistics from journey data
 */
export function calculatePathStats(): PathStats {
  const journeys = mockLearnerJourneys;
  const totalJourneys = journeys.length;
  const avgMonths = journeys.reduce((sum, j) => sum + j.durationMonths, 0) / totalJourneys;

  // Count starting points
  const startCounts: Record<LearnerStartingPoint, number> = {
    beginner: 0,
    "career-switcher": 0,
    intermediate: 0,
    "bootcamp-graduate": 0,
    "self-taught": 0,
  };
  journeys.forEach((j) => startCounts[j.startingPoint]++);

  // Count outcomes
  const outcomeCounts: Record<string, number> = {};
  journeys.forEach((j) => {
    outcomeCounts[j.outcome] = (outcomeCounts[j.outcome] || 0) + 1;
  });

  const popularStartingPoint = Object.entries(startCounts).sort(([, a], [, b]) => b - a)[0][0] as LearnerStartingPoint;
  const popularOutcome = Object.entries(outcomeCounts).sort(([, a], [, b]) => b - a)[0][0];

  return {
    totalJourneys,
    averageMonths: Math.round(avgMonths * 10) / 10,
    successRate: 94, // Mock success rate
    popularStartingPoint,
    popularOutcome: popularOutcome as PathStats["popularOutcome"],
  };
}

/**
 * Get formatted outcome label
 */
export function getOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    "frontend-engineer": "Frontend Engineer",
    "senior-engineer": "Senior Engineer",
    "fullstack-developer": "Fullstack Developer",
    "data-scientist": "Data Scientist",
    "tech-lead": "Tech Lead",
    "product-engineer": "Product Engineer",
    "devops-engineer": "DevOps Engineer",
  };
  return labels[outcome] || outcome;
}

/**
 * Get formatted starting point label
 */
export function getStartingPointLabel(startingPoint: LearnerStartingPoint): string {
  const labels: Record<LearnerStartingPoint, string> = {
    beginner: "Complete Beginner",
    "career-switcher": "Career Switcher",
    intermediate: "Intermediate Developer",
    "bootcamp-graduate": "Bootcamp Graduate",
    "self-taught": "Self-Taught",
  };
  return labels[startingPoint] || startingPoint;
}
