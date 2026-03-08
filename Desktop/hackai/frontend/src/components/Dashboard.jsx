import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile } from '../api/profile';

const STORAGE_KEY = 'learnlens_user_id';

// Mock: matches example persona; can be overridden by loaded profile
const MOCK_PROFILE = {
  role: 'Software Engineer',
  goal: 'Stay current in AI / LLM systems',
  level: 'Intermediate',
  focusArea: ['LLM applications'],
  skills: ['Python', 'APIs'],
};

const MOCK_NEXT_CONCEPT = {
  name: 'Vector Databases',
  reason: 'You’re comfortable with embeddings and ready to store and retrieve them at scale. Vector databases are the next step to build RAG and semantic search.',
};

const MOCK_SNIPPETS = [
  {
    id: 1,
    title: 'Vector Databases Explained',
    source: 'YouTube',
    start: '4:10',
    end: '7:20',
    description: 'Covers what vector DBs are, when to use them, and how they differ from traditional databases.',
  },
  {
    id: 2,
    title: 'RAG Architecture Overview',
    source: 'YouTube',
    start: '1:50',
    end: '4:30',
    description: 'High-level RAG flow: chunking, embedding, retrieval, and generation.',
  },
  {
    id: 3,
    title: 'Embeddings in 5 Minutes',
    source: 'YouTube',
    start: '0:00',
    end: '5:00',
    description: 'Quick intro to vector embeddings and how they represent meaning.',
  },
];

// Learning path: ordered concepts with status and short description for hover
const LEARNING_PATH = [
  { name: 'Prompt Engineering', status: 'known', description: 'Crafting inputs to get the best outputs from LLMs. Foundation for all LLM workflows.' },
  { name: 'Embeddings', status: 'in progress', description: 'Turning text into vectors that capture meaning. Enables semantic search and similarity.' },
  { name: 'Vector Databases', status: 'weak', description: 'Storing and querying embeddings at scale. Core infrastructure for RAG and retrieval.' },
  { name: 'RAG', status: 'unexplored', description: 'Retrieval-augmented generation: combine your data with LLMs for accurate, grounded answers.' },
  { name: 'Agents', status: 'unexplored', description: 'LLMs that use tools and take multi-step actions. From chatbots to autonomous workflows.' },
];

const MOCK_ACTIVITY = [
  { id: 1, type: 'concept', text: 'Explored Embeddings', time: '2 hours ago' },
  { id: 2, type: 'explanation', text: 'Requested explanation: attention mechanism', time: 'Yesterday' },
  { id: 3, type: 'concept', text: 'Reviewed Prompt Engineering', time: '2 days ago' },
];

const STATUS_COLORS = {
  known: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'in progress': 'bg-amber-100 text-amber-800 border-amber-300',
  weak: 'bg-orange-100 text-orange-800 border-orange-300',
  unexplored: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABEL = {
  known: 'Known',
  'in progress': 'In progress',
  weak: 'Weak',
  unexplored: 'Unexplored',
};

function PathNode({ concept }) {
  const colors = STATUS_COLORS[concept.status];
  return (
    <div className="relative group shrink-0">
      <div
        className={`rounded-xl border-2 px-4 py-3 text-center font-semibold text-sm min-w-[120px] transition shadow-sm hover:shadow-md ${colors}`}
      >
        {concept.name}
      </div>
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-56 bg-slate-800 text-white text-left text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20 shadow-xl pointer-events-none">
        <p className="font-semibold text-white">{concept.name}</p>
        <p className="mt-0.5 text-slate-300 capitalize">{STATUS_LABEL[concept.status]}</p>
        <p className="mt-1.5 text-slate-400 leading-relaxed">{concept.description}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

function PathArrow() {
  return (
    <div className="shrink-0 flex items-center px-1 text-slate-300" aria-hidden>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate('/');
  };

  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      setLoading(false);
      return;
    }
    getProfile(userId)
      .then((p) => {
        if (p) {
          setProfile({
            role: p.role || MOCK_PROFILE.role,
            goal: p.goal || MOCK_PROFILE.goal,
            level: (p.level && p.level.charAt(0).toUpperCase() + p.level.slice(1)) || MOCK_PROFILE.level,
            focusArea: p.focusArea?.length ? p.focusArea : MOCK_PROFILE.focusArea,
            skills: p.skills?.length ? p.skills : MOCK_PROFILE.skills,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-slate-800 tracking-tight hover:text-indigo-600 transition">
            LearnLens
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-slate-700">{profile.role}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 capitalize">{profile.level}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Log out
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Learning dashboard</h1>
          <p className="text-slate-500 mt-0.5">{profile.goal}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Learning Profile Card */}
        <Card title="Learning profile">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</p>
              <p className="text-slate-800 font-medium mt-0.5">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Focus areas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.focusArea.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-sm font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.skills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Recommended Next Concept */}
        <Card title="Recommended next concept">
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
            <h4 className="text-xl font-bold text-slate-800">{MOCK_NEXT_CONCEPT.name}</h4>
            <p className="text-slate-600 mt-3 leading-relaxed">{MOCK_NEXT_CONCEPT.reason}</p>
          </div>
        </Card>

        {/* Recommended Learning Snippets */}
        <Card title="Recommended learning snippets">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_SNIPPETS.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <h4 className="font-semibold text-slate-800">{s.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{s.source} · {s.start} – {s.end}</p>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Learning Map — visual path */}
        <Card title="Learning map">
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="flex items-center justify-center min-w-max gap-0">
              {LEARNING_PATH.map((concept, i) => (
                <div key={concept.name} className="flex items-center gap-0">
                  <PathNode concept={concept} />
                  {i < LEARNING_PATH.length - 1 && <PathArrow />}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 justify-center">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Known</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> In progress</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Weak</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Unexplored</span>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent activity">
          <ul className="space-y-3">
            {MOCK_ACTIVITY.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0 last:pb-0">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.type === 'concept' ? 'bg-indigo-500' : 'bg-violet-500'}`} />
                <div>
                  <p className="text-slate-800 font-medium text-sm">{a.text}</p>
                  <p className="text-xs text-slate-500">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}
