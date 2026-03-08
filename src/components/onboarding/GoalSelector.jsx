import { GOAL_OPTIONS } from "../../data/goalSkillMap";

export default function GoalSelector({ value, onChange, error }) {
  return (
    <div className="onboarding-field">
      <label className="onboarding-label">Target goal</label>
      <p className="onboarding-helper">What are you trying to achieve?</p>
      <div className="onboarding-goal-grid">
        {GOAL_OPTIONS.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => onChange(goal.id)}
            className={`onboarding-goal-chip ${value === goal.id ? "onboarding-goal-chip--selected" : ""}`}
          >
            {goal.label}
          </button>
        ))}
      </div>
      {error && <p className="onboarding-error">{error}</p>}
    </div>
  );
}
