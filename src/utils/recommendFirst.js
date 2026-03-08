/**
 * Mock: pick first recommended topic/video based on goal + existing skills.
 * TODO: Replace with real recommender API (e.g. GET /api/recommendations or similar).
 */

import { GOAL_SKILL_MAP, getGoalLabel } from "../data/goalSkillMap";

/**
 * @param {{ goal: string, existing_skills: string[] }} profile
 * @returns {{ topic: string, reason: string, videoId?: string, videoTitle?: string }}
 */
export function recommendFirst(profile) {
  const skills = GOAL_SKILL_MAP[profile.goal] || [];
  const has = new Set(profile.existing_skills || []);
  const missing = skills.filter((s) => !has.has(s));

  const goalLabel = getGoalLabel(profile.goal);

  // Pick first missing skill as recommended topic; if none missing, pick first in map
  const topic =
    missing.length > 0
      ? missing[0]
      : skills.length > 0
        ? skills[0]
        : "Getting started";

  let reason;
  if (missing.length > 0) {
    reason = `Because you're aiming for ${goalLabel} and already have ${has.size > 0 ? [...has].slice(0, 3).join(", ") + (has.size > 3 ? "…" : "") : "some skills"} covered, a strong next area is **${topic}**.`;
  } else {
    reason = `You've selected all skills for ${goalLabel}. We recommend starting with **${topic}** to reinforce fundamentals.`;
  }

  // Optional: attach a placeholder video for "Start with this video"
  // TODO: Replace with real video from backend recommender / YouTube search
  const placeholderVideos = {
    "faang-dsa": { id: "dQw4w9WgXcQ", title: "DSA fundamentals" },
    "ml-engineering": { id: "dQw4w9WgXcQ", title: "ML intro" },
    "system-design": { id: "dQw4w9WgXcQ", title: "System design basics" },
    certification: { id: "dQw4w9WgXcQ", title: "Certification prep" },
  };
  const placeholder = placeholderVideos[profile.goal] || placeholderVideos["faang-dsa"];

  return {
    topic,
    reason,
    videoId: placeholder.id,
    videoTitle: placeholder.title,
  };
}
