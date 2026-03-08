// LearnFlow – Code to Figma Plugin
// Generates editable Figma frames from the production React codebase

figma.showUI(__html__, { width: 320, height: 480, title: "LearnFlow → Figma" });

// ─── Design Tokens ────────────────────────────────────────────────────────────
const TOKENS = {
  bg:        { r: 0.05, g: 0.05, b: 0.10 },
  surface:   { r: 0.09, g: 0.12, b: 0.18 },
  surface2:  { r: 0.13, g: 0.18, b: 0.28 },
  border:    { r: 0.18, g: 0.22, b: 0.32 },
  primary:   { r: 0.39, g: 0.40, b: 0.95 },
  primary2:  { r: 0.65, g: 0.55, b: 0.98 },
  green:     { r: 0.20, g: 0.83, b: 0.60 },
  yellow:    { r: 0.98, g: 0.75, b: 0.14 },
  blue:      { r: 0.38, g: 0.64, b: 0.98 },
  cyan:      { r: 0.13, g: 0.83, b: 0.93 },
  red:       { r: 0.97, g: 0.27, b: 0.27 },
  textPrim:  { r: 0.89, g: 0.91, b: 0.95 },
  textSec:   { r: 0.58, g: 0.64, b: 0.72 },
  textMuted: { r: 0.39, g: 0.44, b: 0.52 },
  white:     { r: 1.00, g: 1.00, b: 1.00 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// FIXED: must include type: "SOLID"
function rgb(t, a = 1) {
  return [{ type: "SOLID", color: { r: t.r, g: t.g, b: t.b }, opacity: a }];
}

async function loadFont(style = "Regular") {
  await figma.loadFontAsync({ family: "Inter", style });
}

function setFill(node, token, a = 1) {
  node.fills = rgb(token, a);
}

function setStroke(node, token, a = 1, weight = 1) {
  node.strokes = rgb(token, a);
  node.strokeWeight = weight;
  node.strokeAlign = "INSIDE";
}

function rect(name, x, y, w, h, fillToken, a = 1, radius = 0) {
  const r = figma.createRectangle();
  r.name = name;
  r.x = x; r.y = y;
  r.resize(Math.max(w, 1), Math.max(h, 1));
  if (fillToken) setFill(r, fillToken, a);
  else r.fills = [];
  if (radius) r.cornerRadius = radius;
  return r;
}

async function text(content, x, y, size, token, style = "Regular", width = 0) {
  await loadFont(style);
  const t = figma.createText();
  t.x = x; t.y = y;
  t.fontName = { family: "Inter", style };
  t.fontSize = size;
  t.fills = rgb(token);
  t.characters = String(content);
  if (width > 0) {
    t.textAutoResize = "HEIGHT";
    t.resize(Math.max(width, 1), t.height);
  }
  return t;
}

function frame(name, x, y, w, h, fillToken = null, a = 1) {
  const f = figma.createFrame();
  f.name = name;
  f.x = x; f.y = y;
  f.resize(Math.max(w, 1), Math.max(h, 1));
  f.fills = fillToken ? rgb(fillToken, a) : [];
  f.clipsContent = true;
  return f;
}

// Spoke line replacement: thin rectangle rotated around center point
function spoke(name, cx, cy, angle, length) {
  const r = figma.createRectangle();
  r.name = name;
  r.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
  r.resize(length, 1);
  // Position at center, then rotate
  r.x = cx;
  r.y = cy - 0.5;
  r.rotation = -(angle * 180 / Math.PI);
  return r;
}

// ─── Screen builders ──────────────────────────────────────────────────────────

async function buildPersonaLogin(ox, oy) {
  const W = 900, H = 620;
  const f = frame("Persona Login", ox, oy, W, H, TOKENS.bg);

  // Header
  const title = await text("Who's learning today?", 0, 60, 28, TOKENS.textPrim, "Bold", W);
  title.textAlignHorizontal = "CENTER";
  f.appendChild(title);

  const sub = await text("Choose your profile to get personalised recommendations", 0, 100, 14, TOKENS.textSec, "Regular", W);
  sub.textAlignHorizontal = "CENTER";
  f.appendChild(sub);

  // Persona cards
  const personas = [
    { name: "Sarah",  role: "Backend Developer", exp: "3 years experience",  goal: "Learn ML for a promotion",      emoji: "👩‍💻", color: TOKENS.primary2 },
    { name: "James",  role: "Senior PM",          exp: "5 years experience",  goal: "Lead AI product teams",         emoji: "📊",  color: TOKENS.blue },
    { name: "Priya",  role: "Data Analyst",       exp: "2 years experience",  goal: "Cloud for data engineering",    emoji: "☁️",  color: TOKENS.green },
    { name: "Marcus", role: "CS Senior",          exp: "Final year student",  goal: "Master DSA for interviews",     emoji: "🎓",  color: TOKENS.yellow },
  ];

  const cardW = 190, cardH = 220, gap = 16;
  const totalW = personas.length * cardW + (personas.length - 1) * gap;
  const startX = (W - totalW) / 2;

  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const cx = startX + i * (cardW + gap);
    const card = frame(`Card – ${p.name}`, cx, 160, cardW, cardH, TOKENS.surface);
    card.cornerRadius = 16;
    setStroke(card, p.color, 0.35, 1.5);

    // Accent bar
    const bar = rect("accent-bar", 0, 0, cardW, 4, p.color);
    card.appendChild(bar);

    // Emoji
    await loadFont("Regular");
    const em = figma.createText();
    em.fontName = { family: "Inter", style: "Regular" };
    em.fontSize = 32;
    em.fills = rgb(TOKENS.white);
    em.characters = p.emoji;
    em.x = (cardW - em.width) / 2;
    em.y = 18;
    card.appendChild(em);

    const nameT = await text(p.name, 0, 68, 15, TOKENS.textPrim, "Bold", cardW);
    nameT.textAlignHorizontal = "CENTER";
    card.appendChild(nameT);

    const roleT = await text(p.role, 0, 88, 10, p.color, "Semi Bold", cardW);
    roleT.textAlignHorizontal = "CENTER";
    card.appendChild(roleT);

    const expT = await text(p.exp, 0, 103, 10, TOKENS.textMuted, "Regular", cardW);
    expT.textAlignHorizontal = "CENTER";
    card.appendChild(expT);

    const divLine = rect("divider", 16, 122, cardW - 32, 1, TOKENS.border, 0.3);
    card.appendChild(divLine);

    const goalT = await text(p.goal, 12, 132, 10, TOKENS.textSec, "Regular", cardW - 24);
    goalT.textAlignHorizontal = "CENTER";
    card.appendChild(goalT);

    const btnBg = rect("btn-bg", 16, cardH - 44, cardW - 32, 30, p.color, 0.15, 8);
    setStroke(btnBg, p.color, 0.5, 1);
    card.appendChild(btnBg);

    const btnT = await text("Select Profile", 0, cardH - 37, 11, p.color, "Semi Bold", cardW);
    btnT.textAlignHorizontal = "CENTER";
    card.appendChild(btnT);

    f.appendChild(card);
  }

  return f;
}

async function buildMainApp(ox, oy) {
  const W = 1200, H = 760;
  const f = frame("Main App – Video Player", ox, oy, W, H, TOKENS.bg);

  // Nav bar
  const nav = frame("Nav", 0, 0, W, 52, TOKENS.surface);
  setStroke(nav, TOKENS.border, 0.4, 1);

  const logo = await text("LearnFlow", 20, 15, 18, TOKENS.primary2, "Bold");
  nav.appendChild(logo);

  const navItems = ["Dashboard", "My Learning", "Explore", "Progress"];
  for (let i = 0; i < navItems.length; i++) {
    const t = await text(navItems[i], 200 + i * 110, 18, 13,
      i === 0 ? TOKENS.textPrim : TOKENS.textSec,
      i === 0 ? "Semi Bold" : "Regular");
    nav.appendChild(t);
  }
  const ava = rect("avatar", W - 52, 10, 32, 32, TOKENS.primary, 0.3, 16);
  nav.appendChild(ava);
  const avaT = await text("S", W - 40, 17, 13, TOKENS.primary2, "Bold");
  nav.appendChild(avaT);
  f.appendChild(nav);

  // URL input
  const inputBg = rect("url-input-bg", 20, 68, W - 40, 40, TOKENS.surface2, 1, 8);
  setStroke(inputBg, TOKENS.border, 0.5, 1);
  f.appendChild(inputBg);
  const placeholder = await text("Paste YouTube URL here...", 36, 78, 13, TOKENS.textMuted);
  f.appendChild(placeholder);
  const loadBtn = rect("load-btn-bg", W - 120, 72, 100, 32, TOKENS.primary, 1, 8);
  f.appendChild(loadBtn);
  const loadT = await text("Load Video", W - 106, 80, 12, TOKENS.white, "Semi Bold");
  f.appendChild(loadT);

  // Video player
  const playerBg = rect("video-player-bg", 20, 124, 780, 438, TOKENS.surface, 1, 12);
  f.appendChild(playerBg);
  const playIcon = await text("▶", 374, 310, 48, TOKENS.textMuted);
  f.appendChild(playIcon);
  const videoLabel = await text("YouTube Video Player", 280, 370, 14, TOKENS.textMuted, "Regular");
  f.appendChild(videoLabel);

  // Concept overlay tags
  const concepts = [
    { label: "Neural Net",    cx: 200, cy: 220, color: TOKENS.primary },
    { label: "Backprop",      cx: 390, cy: 190, color: TOKENS.green },
    { label: "Loss Function", cx: 560, cy: 300, color: TOKENS.yellow },
    { label: "Weights",       cx: 650, cy: 170, color: TOKENS.cyan },
  ];
  for (const c of concepts) {
    const labelW = Math.max(c.label.length * 7 + 24, 90);
    const dotBg = rect(`tag-${c.label}`, c.cx + 20 - labelW / 2, c.cy + 124 - 13, labelW, 26, c.color, 0.9, 6);
    f.appendChild(dotBg);
    const dotT = await text(c.label, c.cx + 20 - labelW / 2, c.cy + 124 - 7, 11, TOKENS.white, "Semi Bold", labelW);
    dotT.textAlignHorizontal = "CENTER";
    f.appendChild(dotT);
  }

  // Sidebar
  const sbW = W - 820;
  const sidebar = frame("Sidebar", 820, 52, sbW, H - 52, TOKENS.surface);
  setStroke(sidebar, TOKENS.border, 0.4, 1);

  const sideTitle = await text("Concepts Detected", 20, 20, 14, TOKENS.textPrim, "Semi Bold");
  sidebar.appendChild(sideTitle);
  const sideCount = await text("4 concepts", 20, 42, 11, TOKENS.textMuted);
  sidebar.appendChild(sideCount);
  sidebar.appendChild(rect("divider", 0, 62, sbW, 1, TOKENS.border, 0.3));

  const sideItems = [
    { name: "Neural Net",    desc: "A computing system modeled on the brain's neural structure", color: TOKENS.primary },
    { name: "Backprop",      desc: "Algorithm for training neural networks via gradient descent", color: TOKENS.green },
    { name: "Loss Function", desc: "Measures how far predictions are from actual values",        color: TOKENS.yellow },
    { name: "Weights",       desc: "Learnable parameters adjusted during model training",         color: TOKENS.cyan },
  ];
  for (let i = 0; i < sideItems.length; i++) {
    const s = sideItems[i];
    const yy = 78 + i * 88;
    sidebar.appendChild(rect(`item-${i}`, 12, yy, sbW - 24, 76, TOKENS.surface2, 1, 10));
    sidebar.appendChild(rect(`dot-${i}`, 24, yy + 12, 8, 8, s.color, 1, 4));
    sidebar.appendChild(await text(s.name, 40, yy + 8, 13, TOKENS.textPrim, "Semi Bold", sbW - 60));
    sidebar.appendChild(await text(s.desc, 24, yy + 28, 10, TOKENS.textSec, "Regular", sbW - 48));
  }
  f.appendChild(sidebar);

  return f;
}

async function buildSkillRadar(ox, oy) {
  const W = 500, H = 480;
  const f = frame("Skill Radar Chart", ox, oy, W, H, TOKENS.surface);
  f.cornerRadius = 16;
  setStroke(f, TOKENS.border, 0.4, 1);

  f.appendChild(await text("Skill Progress", 20, 20, 16, TOKENS.textPrim, "Semi Bold"));
  f.appendChild(await text("Domain: DSA", 20, 44, 11, TOKENS.textMuted));

  const cx = W / 2, cy = H / 2 + 20;
  const skills = ["Arrays", "Strings", "Hash Tables", "Stacks", "Queues",
                  "Linked Lists", "Sorting", "Binary Search", "Trees", "Graphs"];
  const scores  = [80, 65, 55, 70, 45, 60, 75, 50, 40, 35];
  const maxR = 150;
  const n = skills.length;

  // Grid rings (ellipses)
  for (let ring = 1; ring <= 4; ring++) {
    const r = (maxR / 4) * ring;
    const el = figma.createEllipse();
    el.name = `ring-${ring}`;
    el.resize(r * 2, r * 2);
    el.x = cx - r; el.y = cy - r;
    el.fills = [];
    el.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
    el.strokeWeight = 1;
    f.appendChild(el);
  }

  // Spokes (thin rectangles instead of createLine)
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;

    // Spoke as thin rect
    const sp = spoke(`spoke-${i}`, cx, cy, angle, maxR);
    f.appendChild(sp);

    // Label
    const lx = cx + Math.cos(angle) * (maxR + 18);
    const ly = cy + Math.sin(angle) * (maxR + 18);
    const label = await text(skills[i], lx - 40, ly - 7, 9, TOKENS.textSec, "Regular", 80);
    label.textAlignHorizontal = "CENTER";
    f.appendChild(label);

    // Score dot
    const sr = (scores[i] / 100) * maxR;
    const sx = cx + Math.cos(angle) * sr - 4;
    const sy = cy + Math.sin(angle) * sr - 4;
    f.appendChild(rect(`score-dot-${i}`, sx, sy, 8, 8, TOKENS.primary, 1, 4));
  }

  // Legend
  const legendY = H - 52;
  const items = [
    { label: "Current Score", color: TOKENS.primary },
    { label: "Target",        color: TOKENS.textMuted },
  ];
  for (let i = 0; i < items.length; i++) {
    const lx = 20 + i * 160;
    f.appendChild(rect(`legend-dot-${i}`, lx, legendY + 4, 10, 10, items[i].color, 1, 5));
    f.appendChild(await text(items[i].label, lx + 16, legendY + 2, 11, TOKENS.textSec));
  }

  return f;
}

async function buildOnboarding(ox, oy) {
  const W = 800, H = 580;
  const f = frame("Onboarding Flow", ox, oy, W, H, TOKENS.bg);

  // Step indicators
  const steps = ["Welcome", "Set Goal", "Skills", "Recommendations"];
  for (let i = 0; i < steps.length; i++) {
    const isActive = i === 1, isDone = i === 0;
    const dotColor = isDone ? TOKENS.green : isActive ? TOKENS.primary : TOKENS.surface2;
    const dotX = 80 + i * 170;
    f.appendChild(rect(`step-dot-${i}`, dotX, 28, 32, 32, dotColor, 1, 16));
    const label = isDone ? "✓" : String(i + 1);
    const labelColor = (isDone || isActive) ? TOKENS.white : TOKENS.textMuted;
    f.appendChild(await text(label, dotX + 9, 36, 12, labelColor, "Semi Bold"));
    if (i < steps.length - 1) {
      f.appendChild(rect(`step-line-${i}`, 112 + i * 170, 43, 138, 2,
        isDone ? TOKENS.green : TOKENS.surface2, 1));
    }
    f.appendChild(await text(steps[i], 68 + i * 170, 68, 10,
      isActive ? TOKENS.textPrim : TOKENS.textMuted,
      isActive ? "Semi Bold" : "Regular"));
  }

  // Card
  const card = frame("Step Card", 60, 100, W - 120, H - 140, TOKENS.surface);
  card.cornerRadius = 20;
  const innerW = W - 120;

  card.appendChild(await text("What is your learning goal?", 40, 36, 22, TOKENS.textPrim, "Bold", innerW - 80));
  card.appendChild(await text("We'll personalise your learning path based on your goal", 40, 68, 13, TOKENS.textSec, "Regular", innerW - 80));

  const goals = [
    { icon: "🤖", title: "Machine Learning",  desc: "Linear models, neural nets, deep learning" },
    { icon: "🧠", title: "AI Strategy",        desc: "LLMs, prompt eng, RAG, AI products" },
    { icon: "☁️",  title: "Cloud Computing",   desc: "AWS, Docker, Kubernetes, CI/CD" },
    { icon: "🔢",  title: "Data Structures",   desc: "Arrays, trees, graphs, algorithms" },
  ];
  const goalW = (innerW - 80) / 2 - 8;
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const gx = 40 + (i % 2) * (goalW + 16);
    const gy = 108 + Math.floor(i / 2) * 96;
    const isSelected = i === 0;

    const bg = rect(`goal-${i}`, gx, gy, goalW, 80,
      isSelected ? TOKENS.primary : TOKENS.surface2,
      isSelected ? 0.15 : 1, 12);
    setStroke(bg, isSelected ? TOKENS.primary : TOKENS.border, isSelected ? 0.8 : 0.4, 1.5);
    card.appendChild(bg);

    card.appendChild(await text(g.icon, gx + 14, gy + 16, 22));
    card.appendChild(await text(g.title, gx + 52, gy + 18, 13, TOKENS.textPrim, "Semi Bold"));
    card.appendChild(await text(g.desc, gx + 52, gy + 38, 10, TOKENS.textSec, "Regular", goalW - 58));
  }

  // Next button
  const btnX = innerW - 156;
  const btnY = H - 140 - 56;
  card.appendChild(rect("next-btn", btnX, btnY, 120, 38, TOKENS.primary, 1, 10));
  card.appendChild(await text("Continue →", btnX + 14, btnY + 11, 13, TOKENS.white, "Semi Bold"));

  f.appendChild(card);
  return f;
}

async function buildNextToLearn(ox, oy) {
  const W = 520, H = 280;
  const f = frame("Next to Learn", ox, oy, W, H, TOKENS.surface);
  f.cornerRadius = 16;
  setStroke(f, TOKENS.border, 0.4, 1);

  f.appendChild(rect("header-bg", 0, 0, W, 52, TOKENS.primary, 0.08));
  f.appendChild(await text("💡", 16, 12, 22));
  f.appendChild(await text("Next to Learn", 50, 15, 15, TOKENS.primary2, "Semi Bold"));

  const badge = rect("ai-badge", W - 82, 14, 66, 22, TOKENS.primary, 0.15, 11);
  setStroke(badge, TOKENS.primary, 0.4, 1);
  f.appendChild(badge);
  f.appendChild(await text("AI Pick", W - 68, 18, 10, TOKENS.primary2, "Semi Bold"));

  f.appendChild(await text("Based on your recent activity, the system suggests focusing on", 16, 62, 12, TOKENS.textMuted, "Regular", W - 32));

  const topicBg = rect("topic-bg", 16, 94, W - 32, 48, TOKENS.primary, 0.12, 12);
  setStroke(topicBg, TOKENS.primary, 0.3, 1);
  f.appendChild(topicBg);
  f.appendChild(await text("Dynamic Programming", 30, 108, 17, TOKENS.textPrim, "Bold"));

  f.appendChild(await text("You've covered sorting and binary search. Dynamic Programming builds on recursion and is commonly tested in FAANG interviews.", 16, 156, 11, TOKENS.textSec, "Regular", W - 32));

  f.appendChild(rect("explore-btn", 16, H - 52, 160, 36, TOKENS.primary, 1, 10));
  f.appendChild(await text("Explore Topic →", 28, H - 40, 12, TOKENS.white, "Semi Bold"));
  f.appendChild(await text("Skip for now", 200, H - 37, 12, TOKENS.textMuted));

  return f;
}

async function buildSkillGap(ox, oy) {
  const W = 500, H = 440;
  const f = frame("Skill Gap Analysis", ox, oy, W, H, TOKENS.surface);
  f.cornerRadius = 16;
  setStroke(f, TOKENS.border, 0.4, 1);

  f.appendChild(await text("Skill Gap Analysis", 20, 20, 16, TOKENS.textPrim, "Semi Bold"));
  f.appendChild(await text("Areas to focus on to reach your goal", 20, 44, 11, TOKENS.textMuted));
  f.appendChild(rect("divider", 0, 66, W, 1, TOKENS.border, 0.3));

  const gaps = [
    { skill: "Dynamic Programming", current: 20, target: 80, priority: "High",   color: TOKENS.red },
    { skill: "Graph Algorithms",    current: 35, target: 75, priority: "High",   color: TOKENS.red },
    { skill: "Heaps & Priority Q",  current: 45, target: 70, priority: "Medium", color: TOKENS.yellow },
    { skill: "Backtracking",        current: 55, target: 70, priority: "Medium", color: TOKENS.yellow },
    { skill: "Binary Search Trees", current: 60, target: 75, priority: "Low",    color: TOKENS.green },
  ];

  const barW = W - 40;
  for (let i = 0; i < gaps.length; i++) {
    const g = gaps[i];
    const yy = 82 + i * 66;

    f.appendChild(await text(g.skill, 20, yy, 13, TOKENS.textPrim, "Semi Bold"));

    const prioBg = rect(`prio-${i}`, W - 82, yy, 62, 18, g.color, 0.15, 9);
    setStroke(prioBg, g.color, 0.4, 1);
    f.appendChild(prioBg);
    f.appendChild(await text(g.priority, W - 74, yy + 3, 9, g.color, "Semi Bold"));

    // Track
    f.appendChild(rect(`track-${i}`, 20, yy + 22, barW, 8, TOKENS.surface2, 1, 4));
    // Current fill
    const fillW = Math.max((g.current / 100) * barW, 4);
    f.appendChild(rect(`fill-${i}`, 20, yy + 22, fillW, 8, TOKENS.primary, 0.7, 4));
    // Target marker
    const tx = 20 + (g.target / 100) * barW - 1;
    f.appendChild(rect(`target-${i}`, tx, yy + 18, 2, 16, g.color, 0.9));

    f.appendChild(await text(`${g.current}%`, 20, yy + 36, 9, TOKENS.textMuted));
    f.appendChild(await text(`Target: ${g.target}%`, Math.max(tx - 34, 20), yy + 36, 9, g.color));
  }

  return f;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "generate") return;

  try {
    // Pre-load all fonts
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });

    const screens = msg.screens;
    const GAP = 80;
    const created = [];
    let xOffset = 0;

    const widths = {
      "persona-login": 900,
      "main-app":      1200,
      "skill-radar":   500,
      "onboarding":    800,
      "next-to-learn": 520,
      "skill-gap":     500,
    };

    const builders = {
      "persona-login": () => buildPersonaLogin(xOffset, 0),
      "main-app":      () => buildMainApp(xOffset, 0),
      "skill-radar":   () => buildSkillRadar(xOffset, 0),
      "onboarding":    () => buildOnboarding(xOffset, 0),
      "next-to-learn": () => buildNextToLearn(xOffset, 0),
      "skill-gap":     () => buildSkillGap(xOffset, 0),
    };

    for (const id of screens) {
      if (builders[id]) {
        const f = await builders[id]();
        figma.currentPage.appendChild(f);
        created.push(f);
        xOffset += (widths[id] || 500) + GAP;
      }
    }

    if (created.length) {
      figma.viewport.scrollAndZoomIntoView(created);
    }

    figma.ui.postMessage({ type: "done", count: created.length });

  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    figma.ui.postMessage({ type: "error", message: msg });
  }
};
