import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeStep from "../components/onboarding/WelcomeStep";
import ProfileStep from "../components/onboarding/ProfileStep";

const USER_ID_KEY = "learnflow_user_id";
const ONBOARDING_COMPLETE_KEY = "learnflow_onboardingComplete";
const PROFILE_CACHE_KEY = "learnflow_profile";

const API_BASE = "http://localhost:8000";

function getOrCreateUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

const defaultProfile = {
  role: "",
  goal: "",
  existing_skills: [],
  time_constraint: "",
};

function validateProfile(profile) {
  const errors = {};
  if (!profile.role?.trim()) errors.role = "Current role is required.";
  if (!profile.goal) errors.goal = "Please select a target goal.";
  return errors;
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(defaultProfile);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleProfileSubmit = useCallback(async () => {
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const user_id = getOrCreateUserId();
    const payload = {
      user_id,
      role: profile.role.trim(),
      goal: profile.goal,
      existing_skills: profile.existing_skills || [],
      time_constraint: profile.time_constraint?.trim() || null,
    };

    console.log("[Onboarding] Payload before POST:", payload);

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[Onboarding] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("[Onboarding] POST failed:", res.status, text);
        setSubmitError("Could not save profile. Please try again.");
        setSubmitting(false);
        return;
      }

      console.log("[Onboarding] POST success, saving to localStorage and navigating to /");
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
      setSubmitting(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[Onboarding] POST error:", err);
      setSubmitError("Network error. Is the backend running on http://localhost:8000?");
      setSubmitting(false);
    }
  }, [profile, navigate]);

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
        {step === 2 && (
          <>
            {submitError && (
              <div className="onboarding-submit-error" role="alert">
                {submitError}
              </div>
            )}
            <ProfileStep
              profile={profile}
              onChange={setProfile}
              errors={errors}
              onSubmit={handleProfileSubmit}
            />
          </>
        )}
        {submitting && (
          <div className="onboarding-overlay">
            <span className="onboarding-spinner" />
            <span>Saving your profile…</span>
          </div>
        )}
      </div>
      <style>{`
        .onboarding-page {
          min-height: 100vh;
          background: #09090b;
          color: #e4e4e7;
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
        }
        .onboarding-container {
          position: relative;
          width: 100%;
          max-width: 520px;
        }
        .onboarding-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 32px 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }
        .onboarding-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 16px;
        }
        .onboarding-title {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .onboarding-subtext {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          line-height: 1.55;
          margin: 0 0 28px;
        }
        .onboarding-cta {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s;
        }
        .onboarding-cta:hover { opacity: 0.95; }
        .onboarding-cta--full { width: 100%; margin-top: 8px; }
        .onboarding-heading {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 6px;
        }
        .onboarding-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin: 0 0 24px;
          line-height: 1.45;
        }
        .onboarding-form { display: flex; flex-direction: column; gap: 20px; }
        .onboarding-field { display: flex; flex-direction: column; gap: 6px; }
        .onboarding-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
        }
        .onboarding-helper, .onboarding-helper-muted {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin: 0;
          line-height: 1.4;
        }
        .onboarding-helper-muted { color: rgba(255,255,255,0.3); }
        .onboarding-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .onboarding-input::placeholder { color: rgba(255,255,255,0.3); }
        .onboarding-input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.5);
        }
        .onboarding-error {
          font-size: 12px;
          color: #f87171;
          margin: 4px 0 0;
        }
        .onboarding-submit-error {
          font-size: 13px;
          color: #f87171;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .onboarding-goal-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .onboarding-goal-chip {
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(255,255,255,0.8);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
        }
        .onboarding-goal-chip:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .onboarding-goal-chip--selected {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5);
          color: #a5b4fc;
        }
        .onboarding-skill-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .onboarding-skill-chip {
          padding: 8px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
        }
        .onboarding-skill-chip:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .onboarding-skill-chip--selected {
          background: rgba(99,102,241,0.25);
          border-color: rgba(99,102,241,0.45);
          color: #c7d2fe;
        }
        .onboarding-summary {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .onboarding-summary-line {
          font-size: 13px;
          margin: 0 0 4px;
          color: rgba(255,255,255,0.7);
        }
        .onboarding-summary-line:last-child { margin-bottom: 0; }
        .onboarding-summary-label {
          color: rgba(255,255,255,0.4);
          margin-right: 6px;
        }
        .onboarding-recommendation-box {
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 24px;
        }
        .onboarding-recommendation-topic {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 10px;
        }
        .onboarding-recommendation-reason {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          line-height: 1.55;
          margin: 0;
        }
        .onboarding-overlay {
          position: absolute;
          inset: 0;
          background: rgba(9,9,11,0.85);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
        }
        .onboarding-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(99,102,241,0.3);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: onboarding-spin 0.7s linear infinite;
        }
        @keyframes onboarding-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
