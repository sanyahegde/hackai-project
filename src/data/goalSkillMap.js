/**
 * Goal → skills map for onboarding.
 * When user selects a target goal, the skill chips shown come from here.
 * TODO: Sync with backend skill map / recommender when ready.
 */

export const GOAL_OPTIONS = [
  { id: "faang-dsa", label: "Pass FAANG DSA interviews" },
  { id: "ml-engineering", label: "Move into ML engineering" },
  { id: "system-design", label: "Learn system design" },
  { id: "certification", label: "Prepare for a certification" },
];

/** Skills per goal. Keys match GOAL_OPTIONS[].id */
export const GOAL_SKILL_MAP = {
  "faang-dsa": [
    "Arrays",
    "Strings",
    "Hash Maps",
    "Sorting",
    "Binary Search",
    "Two Pointers",
    "Sliding Window",
    "BFS",
    "DFS",
    "Recursion",
    "Dynamic Programming",
    "Graphs",
    "Heaps",
    "Backtracking",
  ],
  "ml-engineering": [
    "Python",
    "Linear Algebra",
    "Statistics",
    "ML Basics",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "MLOps",
    "Data Pipelines",
  ],
  "system-design": [
    "APIs",
    "Databases",
    "Caching",
    "Load Balancing",
    "Microservices",
    "Distributed Systems",
    "Scalability",
    "CAP Theorem",
    "Message Queues",
  ],
  certification: [
    "Core Concepts",
    "Security",
    "Networking",
    "Cloud",
    "Best Practices",
  ],
};

export function getSkillsForGoal(goalId) {
  return GOAL_SKILL_MAP[goalId] || [];
}

export function getGoalLabel(goalId) {
  return GOAL_OPTIONS.find((g) => g.id === goalId)?.label || goalId;
}
