import { getSkillsForGoal } from "../../data/goalSkillMap";

export default function SkillChips({ goalId, selected, onChange }) {
  const skills = getSkillsForGoal(goalId || "");

  if (!goalId || skills.length === 0) {
    return (
      <div className="onboarding-field">
        <label className="onboarding-label">Skills you already have</label>
        <p className="onboarding-helper-muted">Select a target goal above to see skills.</p>
      </div>
    );
  }

  return (
    <div className="onboarding-field">
      <label className="onboarding-label">Skills you already have</label>
      <p className="onboarding-helper">Select what you already know—we’ll skip the basics and focus on gaps.</p>
      <div className="onboarding-skill-wrap">
        {skills.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onChange(selected.filter((s) => s !== skill));
                } else {
                  onChange([...selected, skill]);
                }
              }}
              className={`onboarding-skill-chip ${isSelected ? "onboarding-skill-chip--selected" : ""}`}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
