import { getGoalLabel } from "../../data/goalSkillMap";

export default function RecommendationStep({ profile, recommendation, onStart }) {
  const goalLabel = profile.goal ? getGoalLabel(profile.goal) : "";

  return (
    <div className="onboarding-card">
      <h2 className="onboarding-heading">Recommended starting point</h2>
      <p className="onboarding-subtitle">
        Based on your goal and existing skills, here’s where to begin.
      </p>

      <div className="onboarding-summary">
        <p className="onboarding-summary-line">
          <span className="onboarding-summary-label">Role:</span> {profile.role || "—"}
        </p>
        <p className="onboarding-summary-line">
          <span className="onboarding-summary-label">Goal:</span> {goalLabel || "—"}
        </p>
        {profile.existing_skills?.length > 0 && (
          <p className="onboarding-summary-line">
            <span className="onboarding-summary-label">Skills:</span> {profile.existing_skills.join(", ")}
          </p>
        )}
        {profile.time_constraint && (
          <p className="onboarding-summary-line">
            <span className="onboarding-summary-label">Time:</span> {profile.time_constraint}
          </p>
        )}
      </div>

      <div className="onboarding-recommendation-box">
        <h3 className="onboarding-recommendation-topic">{recommendation.topic}</h3>
        <p className="onboarding-recommendation-reason">
          {recommendation.reason.replace(/\*\*/g, "")}
        </p>
      </div>

      <button type="button" onClick={onStart} className="onboarding-cta onboarding-cta--full">
        Begin learning
      </button>
    </div>
  );
}
