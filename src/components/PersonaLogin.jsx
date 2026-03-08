const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const PERSONAS = [
  {
    id: "sarah-ml",
    name: "Sarah",
    emoji: "👩‍💻",
    color: "#a78bfa",
    role: "Backend Developer",
    experience: "3 years experience",
    goal: "Learn machine learning for a promotion",
    domain: "ml",
    skills: ["Python", "SQL", "REST APIs", "Statistics"],
    defaultVideo: "aircAruvnKk",
    tagline: "From APIs to AI",
    recommendedVideos: [
      {
        id: "Gv9_4yMHFhI",
        segments: [
          { topics: ["Neural Networks", "Deep Learning"], startTime: 195, label: "How neural networks learn" },
          { topics: ["Supervised Learning", "Linear Models"], startTime: 42, label: "Supervised learning basics" },
          { topics: ["Model Evaluation"], startTime: 480, label: "Evaluating model performance" },
          { topics: ["Data Preprocessing", "Training Pipeline"], startTime: 310, label: "Preparing training data" },
          { topics: ["NumPy & Pandas"], startTime: 85, label: "Working with data in Python" },
        ],
      },
      {
        id: "yIYKR4sgzI8",
        segments: [
          { topics: ["Deep Learning", "Neural Networks"], startTime: 130, label: "Deep learning architectures" },
          { topics: ["Training Pipeline"], startTime: 55, label: "Training loop explained" },
          { topics: ["Linear Models"], startTime: 20, label: "From linear models to deep nets" },
          { topics: ["Model Evaluation"], startTime: 390, label: "Loss curves and metrics" },
        ],
      },
      {
        id: "E0Hmnixke2g",
        segments: [
          { topics: ["Unsupervised Learning"], startTime: 60, label: "Clustering and dimensionality reduction" },
          { topics: ["Neural Networks", "Deep Learning"], startTime: 240, label: "Autoencoders" },
          { topics: ["Data Preprocessing"], startTime: 15, label: "Feature engineering" },
          { topics: ["Reinforcement Learning"], startTime: 420, label: "Intro to reinforcement learning" },
        ],
      },
      {
        id: "EuBBz3bI-aA",
        segments: [
          { topics: ["Reinforcement Learning"], startTime: 90, label: "Reward and policy" },
          { topics: ["Neural Networks"], startTime: 250, label: "Neural nets in RL" },
          { topics: ["Model Evaluation"], startTime: 350, label: "Evaluating agent performance" },
          { topics: ["Training Pipeline"], startTime: 180, label: "Training an RL agent" },
        ],
      },
    ],
  },
  {
    id: "james-ai",
    name: "James",
    emoji: "📊",
    color: "#60a5fa",
    role: "Senior Product Manager",
    experience: "5 years experience",
    goal: "Understand AI to lead AI product teams",
    domain: "ai_strategy",
    skills: ["Product Roadmaps", "Agile", "Business Analytics"],
    defaultVideo: "zjkBMFhNj_g",
    tagline: "Leading AI teams",
    recommendedVideos: [
      {
        id: "LPZh9BOjkQs",
        segments: [
          { topics: ["LLMs", "Transformer Architecture"], startTime: 145, label: "How large language models work" },
          { topics: ["ML Fundamentals"], startTime: 25, label: "Machine learning refresher" },
          { topics: ["Prompt Engineering"], startTime: 380, label: "Effective prompting strategies" },
          { topics: ["AI Use Cases"], startTime: 60, label: "Real-world AI applications" },
        ],
      },
      {
        id: "ezdIOLbUSWg",
        segments: [
          { topics: ["RAG"], startTime: 110, label: "Retrieval augmented generation" },
          { topics: ["LLMs"], startTime: 30, label: "LLM capabilities and limits" },
          { topics: ["AI Deployment"], startTime: 320, label: "Deploying AI in production" },
          { topics: ["Fine-tuning"], startTime: 220, label: "When to fine-tune vs prompt" },
        ],
      },
      {
        id: "pwWBcsxEoLk",
        segments: [
          { topics: ["AI Ethics"], startTime: 75, label: "Bias, fairness, and safety" },
          { topics: ["AI Product Strategy"], startTime: 200, label: "Building an AI product roadmap" },
          { topics: ["AI Use Cases"], startTime: 15, label: "Identifying AI opportunities" },
          { topics: ["AI Deployment"], startTime: 350, label: "Scaling AI products" },
        ],
      },
      {
        id: "DzP-4klK1RA",
        segments: [
          { topics: ["Transformer Architecture"], startTime: 90, label: "Attention mechanism deep dive" },
          { topics: ["Fine-tuning"], startTime: 250, label: "Custom model training" },
          { topics: ["Prompt Engineering"], startTime: 180, label: "Advanced prompt patterns" },
          { topics: ["LLMs"], startTime: 40, label: "GPT architecture overview" },
        ],
      },
    ],
  },
  {
    id: "priya-cloud",
    name: "Priya",
    emoji: "☁️",
    color: "#34d399",
    role: "Data Analyst",
    experience: "2 years experience",
    goal: "Learn cloud computing for data engineering",
    domain: "cloud",
    skills: ["Excel", "SQL", "Tableau", "Python"],
    defaultVideo: "pg19Z8LL06w",
    tagline: "Data to the cloud",
    recommendedVideos: [
      {
        id: "6GQRb4fGvtk",
        segments: [
          { topics: ["Docker"], startTime: 180, label: "Building Docker containers" },
          { topics: ["Kubernetes"], startTime: 420, label: "Container orchestration with K8s" },
          { topics: ["Virtual Machines"], startTime: 45, label: "VMs vs containers" },
          { topics: ["CI/CD"], startTime: 550, label: "Automated deployment pipelines" },
        ],
      },
      {
        id: "JIbIYCM48to",
        segments: [
          { topics: ["Kubernetes"], startTime: 120, label: "Pods, services, and deployments" },
          { topics: ["Docker"], startTime: 30, label: "Docker images and registries" },
          { topics: ["Networking"], startTime: 340, label: "Container networking" },
          { topics: ["Data Pipelines"], startTime: 480, label: "Data pipeline infrastructure" },
        ],
      },
      {
        id: "zG1cM9VSINg",
        segments: [
          { topics: ["CI/CD"], startTime: 90, label: "CI/CD pipeline setup" },
          { topics: ["Infrastructure as Code"], startTime: 240, label: "Terraform basics" },
          { topics: ["Serverless"], startTime: 380, label: "Lambda and serverless architecture" },
          { topics: ["AWS Basics"], startTime: 15, label: "AWS services overview" },
        ],
      },
    ],
  },
  {
    id: "marcus-dsa",
    name: "Marcus",
    emoji: "🎓",
    color: "#fbbf24",
    role: "CS Senior",
    experience: "Final year student",
    goal: "Master DSA for technical interviews",
    domain: "dsa",
    skills: ["Java", "Python", "OOP", "Basic DS"],
    defaultVideo: "ouipSd_5ivQ",
    tagline: "Interview ready",
    recommendedVideos: [
      {
        id: "O9v10jQkm5c",
        segments: [
          { topics: ["Dynamic Programming"], startTime: 255, label: "DP problem-solving patterns" },
          { topics: ["Graphs", "Trees"], startTime: 140, label: "Graph traversal techniques" },
          { topics: ["Backtracking"], startTime: 420, label: "Backtracking strategy" },
          { topics: ["Binary Search"], startTime: 60, label: "Binary search applications" },
          { topics: ["Arrays", "Sorting"], startTime: 15, label: "Array manipulation" },
        ],
      },
      {
        id: "ouipSd_5ivQ",
        segments: [
          { topics: ["Trees", "Graphs"], startTime: 180, label: "Tree and graph structures" },
          { topics: ["Dynamic Programming"], startTime: 350, label: "Memoization and tabulation" },
          { topics: ["Heaps"], startTime: 95, label: "Heap operations and priority queues" },
          { topics: ["Stacks", "Queues"], startTime: 30, label: "Stack and queue fundamentals" },
        ],
      },
      {
        id: "KwBuV7YZido",
        segments: [
          { topics: ["Graphs"], startTime: 120, label: "BFS and DFS deep dive" },
          { topics: ["Dynamic Programming", "Backtracking"], startTime: 300, label: "DP vs backtracking" },
          { topics: ["Heaps"], startTime: 200, label: "Heap-based problem solving" },
          { topics: ["Trees"], startTime: 50, label: "Binary tree traversals" },
        ],
      },
    ],
  },
];

export async function seedPersona(persona) {
  try {
    await fetch(`${API_BASE}/api/seed-persona/${persona.id}`, { method: "POST" });
  } catch (e) {
    console.warn("[Persona] Seed failed (non-fatal):", e);
  }
  localStorage.setItem("learnflow_user_id", persona.id);
  localStorage.setItem("learnflow_domain", persona.domain);
  localStorage.setItem("learnflow_persona", JSON.stringify(persona));
}
