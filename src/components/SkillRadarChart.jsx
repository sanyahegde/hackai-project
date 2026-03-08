import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/** Full DSA skill list (matches backend skill_map). Missing skills from API default to 0. */
const ALL_SKILLS = [
  "Arrays",
  "Strings",
  "Hash Tables",
  "Sorting",
  "Binary Search",
  "Trees",
  "Graphs",
  "Heaps",
  "Backtracking",
  "Dynamic Programming",
];

/**
 * Build chart data from API scores. Skills not in the response get score 0.
 * @param {Array<{ skill: string, score: number }>} scores - from GET /api/skill-scores
 * @returns {Array<{ skill: string, score: number }>}
 */
function buildRadarData(scores) {
  const bySkill = {};
  if (Array.isArray(scores)) {
    scores.forEach((s) => {
      bySkill[s.skill] = s.score;
    });
  }
  return ALL_SKILLS.map((skill) => ({
    skill,
    score: bySkill[skill] ?? 0,
  }));
}

/**
 * Radar chart for skill scores. Uses backend scores; missing skills default to 0.
 */
export default function SkillRadarChart({ scores = [] }) {
  const data = buildRadarData(scores);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsRadarChart outerRadius={90} width={280} height={250} data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.12)" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
          tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} />
        <Radar
          name="Skill"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.6}
          strokeWidth={1.5}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
