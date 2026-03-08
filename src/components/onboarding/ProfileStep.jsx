import GoalSelector from "./GoalSelector";
import SkillChips from "./SkillChips";

export default function ProfileStep({ profile, onChange, errors, onSubmit }) {
  return (
    <div className="onboarding-card">
      <h2 className="onboarding-heading">Set up your learning profile</h2>
      <p className="onboarding-subtitle">Tell us what you already know and where you want to go.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="onboarding-form"
      >
        <div className="onboarding-field">
          <label className="onboarding-label" htmlFor="role">
            Current role
          </label>
          <p className="onboarding-helper">Sets the baseline for explanations.</p>
          <input
            id="role"
            type="text"
            value={profile.role}
            onChange={(e) => onChange({ ...profile, role: e.target.value })}
            placeholder="e.g. Backend Engineer at a startup"
            className="onboarding-input"
            autoComplete="organization-title"
          />
          {errors.role && <p className="onboarding-error">{errors.role}</p>}
        </div>

        <GoalSelector
          value={profile.goal}
          onChange={(goal) => onChange({ ...profile, goal })}
          error={errors.goal}
        />

        <SkillChips
          goalId={profile.goal}
          selected={profile.existing_skills}
          onChange={(existing_skills) => onChange({ ...profile, existing_skills })}
        />

        <div className="onboarding-field">
          <label className="onboarding-label" htmlFor="time_constraint">
            Time constraint
          </label>
          <p className="onboarding-helper">Optional—adds urgency and tightens recommendations.</p>
          <input
            id="time_constraint"
            type="text"
            value={profile.time_constraint}
            onChange={(e) => onChange({ ...profile, time_constraint: e.target.value })}
            placeholder="e.g. Interview in 4 weeks"
            className="onboarding-input"
          />
        </div>

        <button type="submit" className="onboarding-cta onboarding-cta--full">
          Continue
        </button>
      </form>
    </div>
  );
}
