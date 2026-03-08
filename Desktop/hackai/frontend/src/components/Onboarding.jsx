import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createProfile, getProfile } from '../api/profile';

const STORAGE_KEY = 'learnlens_user_id';
const TOTAL_STEPS = 6;
const STEP_TITLES = ['Profile', 'Learning Goal', 'Current Knowledge', 'Learning Focus', 'Learning Style', 'Summary'];

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const TARGET_OUTCOMES = [
  'stay current in my field',
  'become more effective at work',
  'transition into a new role',
  'build real-world projects',
  'prepare for interviews',
  'deep technical understanding',
];

const FOCUS_AREAS = [
  'ML fundamentals',
  'LLM applications',
  'AI engineering',
  'research & theory',
  'production systems',
];

const PREFERENCE_OPTIONS = [
  { id: 'videos', label: 'Videos' },
  { id: 'diagrams', label: 'Diagrams' },
  { id: 'hands-on', label: 'Hands-on' },
  { id: 'summaries', label: 'Summaries' },
];

const EXPLANATION_DEPTHS = [
  { id: 'quick intuition', label: 'Quick intuition' },
  { id: 'balanced overview', label: 'Balanced overview' },
  { id: 'deep technical breakdown', label: 'Deep technical breakdown' },
];

const LEARNING_FRICTION = [
  'too much theory',
  "diagrams I don't understand",
  'missing prerequisites',
  'videos move too fast',
  'not enough real examples',
];

const initialForm = {
  role: '',
  resumeText: '',
  goal: '',
  reason: '',
  targetOutcome: [],
  level: '',
  skills: [],
  skillInput: '',
  focusArea: [],
  preferences: [],
  explanationDepth: '',
  learningFriction: [],
};

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-800 placeholder-slate-400';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';
const chipBase = 'px-4 py-2 rounded-xl font-medium transition select-none';

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? `${chipBase} bg-indigo-600 text-white shadow-md`
          : `${chipBase} bg-slate-100 text-slate-600 hover:bg-slate-200`
      }
    >
      {children}
    </button>
  );
}

function MultiChip({ selected, toggle, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <Chip key={id} selected={selected.includes(id)} onClick={() => toggle(id)}>
            {label}
          </Chip>
        );
      })}
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [savedProfile, setSavedProfile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back (for animation)

  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      setLoadingExisting(false);
      return;
    }
    getProfile(userId)
      .then((profile) => {
        if (profile) {
          setForm({
            role: profile.role || '',
            resumeText: profile.resumeText || '',
            goal: profile.goal || '',
            reason: profile.reason || '',
            targetOutcome: profile.targetOutcome || [],
            level: profile.level || '',
            skills: profile.skills || [],
            skillInput: '',
            focusArea: profile.focusArea || [],
            preferences: profile.preferences || [],
            explanationDepth: profile.explanationDepth || '',
            learningFriction: profile.learningFriction || [],
          });
          setSavedProfile(profile);
        }
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoadingExisting(false));
  }, []);

  const goNext = () => {
    setDirection(1);
    setErrors({});
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const validateStep = (s) => {
    const next = {};
    if (s === 1) {
      if (!form.role.trim()) next.role = 'Required';
    }
    if (s === 2) {
      if (!form.goal.trim()) next.goal = 'Required';
      if (!form.reason.trim()) next.reason = 'Required';
    }
    if (s === 3) {
      if (!form.level) next.level = 'Required';
    }
    if (s === 5) {
      if (form.preferences.length === 0) next.preferences = 'Select at least one';
      if (!form.explanationDepth) next.explanationDepth = 'Required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = form.skillInput.trim().replace(/,$/, '');
      if (v && !form.skills.includes(v)) {
        setForm((f) => ({ ...f, skills: [...f.skills, v], skillInput: '' }));
      }
    }
  };

  const removeSkill = (skill) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const toggleMulti = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value],
    }));
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === TOTAL_STEPS) return;
    goNext();
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setLoading(true);
    try {
      const payload = {
        role: form.role.trim(),
        resumeText: form.resumeText.trim() || null,
        goal: form.goal.trim(),
        reason: form.reason.trim(),
        targetOutcome: form.targetOutcome,
        level: form.level,
        skills: form.skills,
        focusArea: form.focusArea,
        preferences: form.preferences,
        explanationDepth: form.explanationDepth,
        learningFriction: form.learningFriction,
        timePerWeek: null,
      };
      const profile = await createProfile(payload);
      localStorage.setItem(STORAGE_KEY, profile.id);
      setSavedProfile(profile);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetAndNew = () => {
    setSavedProfile(null);
    setForm(initialForm);
    setStep(1);
    setErrors({});
    setSubmitError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  if (savedProfile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Profile saved</h1>
            <p className="text-slate-500 mb-6">Your learning profile is ready.</p>
            <div className="text-left bg-slate-50 rounded-xl p-5 space-y-3 mb-6 text-sm">
              <p><span className="text-slate-500 font-medium">Role:</span> <span className="text-slate-800">{savedProfile.role}</span></p>
              <p><span className="text-slate-500 font-medium">Learning:</span> <span className="text-slate-800">{savedProfile.goal}</span></p>
              <p><span className="text-slate-500 font-medium">Why:</span> <span className="text-slate-800">{savedProfile.reason}</span></p>
              {savedProfile.targetOutcome?.length > 0 && (
                <p><span className="text-slate-500 font-medium">Outcomes:</span> <span className="text-slate-800">{savedProfile.targetOutcome.join(', ')}</span></p>
              )}
              <p><span className="text-slate-500 font-medium">Level:</span> <span className="text-slate-800 capitalize">{savedProfile.level}</span></p>
              {savedProfile.skills?.length > 0 && (
                <p><span className="text-slate-500 font-medium">Skills:</span> <span className="text-slate-800">{savedProfile.skills.join(', ')}</span></p>
              )}
              {savedProfile.focusArea?.length > 0 && (
                <p><span className="text-slate-500 font-medium">Focus:</span> <span className="text-slate-800">{savedProfile.focusArea.join(', ')}</span></p>
              )}
              {savedProfile.preferences?.length > 0 && (
                <p><span className="text-slate-500 font-medium">Formats:</span> <span className="text-slate-800">{savedProfile.preferences.join(', ')}</span></p>
              )}
              <p><span className="text-slate-500 font-medium">Depth:</span> <span className="text-slate-800">{savedProfile.explanationDepth}</span></p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={resetAndNew}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Create another profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Profile</h2>
            <div>
              <label className={labelClass}>Current role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Software Engineer"
                className={inputClass}
              />
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
            </div>
            <div>
              <label className={labelClass}>Resume / background (optional)</label>
              <textarea
                value={form.resumeText}
                onChange={(e) => setForm((f) => ({ ...f, resumeText: e.target.value }))}
                placeholder="Paste or type a short summary of your background..."
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Learning Goal</h2>
            <div>
              <label className={labelClass}>What are you trying to learn?</label>
              <input
                type="text"
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="e.g. Machine Learning, System Design"
                className={inputClass}
              />
              {errors.goal && <p className="mt-1 text-sm text-red-500">{errors.goal}</p>}
            </div>
            <div>
              <label className={labelClass}>Why are you learning it?</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Career growth, side project"
                className={inputClass}
              />
              {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
            </div>
            <div>
              <label className={labelClass}>Target outcome</label>
              <p className="text-xs text-slate-500 mb-2">Select all that apply</p>
              <MultiChip
                selected={form.targetOutcome}
                toggle={(id) => toggleMulti('targetOutcome', id)}
                options={TARGET_OUTCOMES}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Current Knowledge</h2>
            <div>
              <label className={labelClass}>Knowledge level</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <Chip
                    key={l}
                    selected={form.level === l}
                    onClick={() => setForm((f) => ({ ...f, level: l }))}
                  >
                    {l}
                  </Chip>
                ))}
              </div>
              {errors.level && <p className="mt-1 text-sm text-red-500">{errors.level}</p>}
            </div>
            <div>
              <label className={labelClass}>Relevant existing skills</label>
              <p className="text-xs text-slate-500 mb-2">Type and press Enter or comma to add</p>
              <input
                type="text"
                value={form.skillInput}
                onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                onKeyDown={addSkill}
                placeholder="e.g. Python, Statistics"
                className={inputClass}
              />
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 font-medium text-sm"
                    >
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="p-0.5 rounded hover:bg-indigo-200/80" aria-label={`Remove ${s}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Learning Focus</h2>
            <p className="text-slate-600 text-sm">Area of focus within your topic (e.g. for AI)</p>
            <div>
              <label className={labelClass}>Focus area</label>
              <p className="text-xs text-slate-500 mb-2">Select all that apply</p>
              <MultiChip
                selected={form.focusArea}
                toggle={(id) => toggleMulti('focusArea', id)}
                options={FOCUS_AREAS}
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Learning Style</h2>
            <div>
              <label className={labelClass}>Preferred learning format</label>
              <p className="text-xs text-slate-500 mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map(({ id, label }) => (
                  <Chip
                    key={id}
                    selected={form.preferences.includes(id)}
                    onClick={() => toggleMulti('preferences', id)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {errors.preferences && <p className="mt-1 text-sm text-red-500">{errors.preferences}</p>}
            </div>
            <div>
              <label className={labelClass}>Explanation depth</label>
              <div className="flex flex-wrap gap-2">
                {EXPLANATION_DEPTHS.map(({ id, label }) => (
                  <Chip
                    key={id}
                    selected={form.explanationDepth === id}
                    onClick={() => setForm((f) => ({ ...f, explanationDepth: id }))}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {errors.explanationDepth && <p className="mt-1 text-sm text-red-500">{errors.explanationDepth}</p>}
            </div>
            <div>
              <label className={labelClass}>Learning friction</label>
              <p className="text-xs text-slate-500 mb-2">Things that slow you down (optional)</p>
              <MultiChip
                selected={form.learningFriction}
                toggle={(id) => toggleMulti('learningFriction', id)}
                options={LEARNING_FRICTION}
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800">Summary</h2>
            <p className="text-slate-600 text-sm">Review your learning profile before saving.</p>
            <div className="bg-slate-50 rounded-xl p-5 space-y-3 text-sm">
              <p><span className="text-slate-500 font-medium">Role:</span> <span className="text-slate-800">{form.role || '—'}</span></p>
              {form.resumeText && <p><span className="text-slate-500 font-medium">Background:</span> <span className="text-slate-800 line-clamp-2">{form.resumeText}</span></p>}
              <p><span className="text-slate-500 font-medium">Learning:</span> <span className="text-slate-800">{form.goal || '—'}</span></p>
              <p><span className="text-slate-500 font-medium">Why:</span> <span className="text-slate-800">{form.reason || '—'}</span></p>
              {form.targetOutcome.length > 0 && <p><span className="text-slate-500 font-medium">Outcomes:</span> <span className="text-slate-800">{form.targetOutcome.join(', ')}</span></p>}
              <p><span className="text-slate-500 font-medium">Level:</span> <span className="text-slate-800 capitalize">{form.level || '—'}</span></p>
              {form.skills.length > 0 && <p><span className="text-slate-500 font-medium">Skills:</span> <span className="text-slate-800">{form.skills.join(', ')}</span></p>}
              {form.focusArea.length > 0 && <p><span className="text-slate-500 font-medium">Focus:</span> <span className="text-slate-800">{form.focusArea.join(', ')}</span></p>}
              {form.preferences.length > 0 && <p><span className="text-slate-500 font-medium">Formats:</span> <span className="text-slate-800">{form.preferences.join(', ')}</span></p>}
              <p><span className="text-slate-500 font-medium">Depth:</span> <span className="text-slate-800">{form.explanationDepth || '—'}</span></p>
              {form.learningFriction.length > 0 && <p><span className="text-slate-500 font-medium">Friction:</span> <span className="text-slate-800">{form.learningFriction.join(', ')}</span></p>}
            </div>
            {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save profile'
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center p-4 md:p-6 py-8">
      {/* Top bar: logo + Log in */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <Link to="/" className="text-xl font-bold text-slate-800 tracking-tight hover:text-indigo-600 transition">
          LearnLens
        </Link>
        <Link
          to="/dashboard"
          className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition text-sm"
        >
          Log in
        </Link>
      </div>

      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">LearnLens</h1>
          <p className="text-slate-500 mt-1.5">Set up your learning profile</p>
          <Link
            to="/dashboard"
            className="inline-block mt-3 text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
          >
            Skip for now →
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{STEP_TITLES[step - 1]}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {STEP_TITLES.map((title, i) => (
              <span
                key={title}
                className={`text-[10px] md:text-xs truncate max-w-[14%] ${i + 1 === step ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}
                title={title}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 md:p-8 min-h-[320px]">
          {renderStep()}
        </div>

        {/* Next / Back */}
        {step < TOTAL_STEPS && (
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
