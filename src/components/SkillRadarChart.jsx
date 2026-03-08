import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const SKILL_LISTS = {
  dsa: [
    "Arrays", "Strings", "Hash Tables", "Stacks", "Queues", "Linked Lists",
    "Sorting", "Binary Search", "Trees", "Graphs", "Heaps",
    "Backtracking", "Dynamic Programming",
  ],
  ml: [
    "Supervised Learning", "Linear Models", "Neural Networks", "Deep Learning",
    "Data Preprocessing", "Model Evaluation", "Unsupervised Learning",
    "Reinforcement Learning", "NumPy & Pandas", "Training Pipeline",
  ],
  ai_strategy: [
    "ML Fundamentals", "LLMs", "Prompt Engineering", "Fine-tuning", "RAG",
    "AI Ethics", "AI Deployment", "AI Use Cases", "AI Product Strategy",
    "Transformer Architecture",
  ],
  cloud: [
    "AWS Basics", "Virtual Machines", "Storage", "Docker", "Kubernetes",
    "CI/CD", "Serverless", "Infrastructure as Code", "Networking",
    "Data Pipelines",
  ],
};

function buildRadarData(scores, domain) {
  const allSkills = SKILL_LISTS[domain] || SKILL_LISTS.dsa;
  const bySkill = {};
  if (Array.isArray(scores)) {
    scores.forEach((s) => {
      bySkill[s.skill] = s.score;
    });
  }
  return allSkills.map((skill) => ({
    skill,
    score: bySkill[skill] ?? 0,
  }));
}

export default function SkillRadarChart({ scores = [], domain = "dsa" }) {
  const data = buildRadarData(scores, domain);

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
