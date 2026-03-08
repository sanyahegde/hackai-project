export default function WelcomeStep({ onNext }) {
  return (
    <div className="onboarding-card">
      <div className="onboarding-badge">LearnFlow</div>
      <h1 className="onboarding-title">Turn videos into active learning</h1>
      <p className="onboarding-subtext">
        LearnFlow personalizes what to watch and what to study next—so you spend time on the right topics at the right pace.
      </p>
      <button type="button" onClick={onNext} className="onboarding-cta">
        Get started
      </button>
    </div>
  );
}
