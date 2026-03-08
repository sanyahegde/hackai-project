import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════ */
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = "claude-haiku-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getOrCreateUserId() {
  let id = localStorage.getItem("learnflow_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("learnflow_user_id", id);
  }
  return id;
}

const USER_ID = getOrCreateUserId();

const DETECT_PROMPT = `You are an educational image analyzer. Analyze this screenshot from an educational video or lecture. Identify each distinct concept, diagram, data structure, formula, or labeled element visible in the image. For each identified item, return:
- name: short label
- description: 1-2 sentence explanation suitable for a student
- x: horizontal position as percentage (0-100) of image width, representing the CENTER of where this concept appears
- y: vertical position as percentage (0-100) of image height, representing the CENTER of where this concept appears

Return ONLY a valid JSON array, no markdown, no backticks, no explanation.
Example: [{"name":"Stack","description":"A LIFO data structure where elements are added and removed from the top.","x":25,"y":40},{"name":"Queue","description":"A FIFO data structure where elements are added at the rear and removed from the front.","x":70,"y":40}]`;

/* ═══════════════════════════════════════════════════
   COLORS
   ═══════════════════════════════════════════════════ */
const categoryColors = {
  concept: { bg: "rgba(99,102,241,0.9)", ring: "rgba(99,102,241,0.3)", text: "#818cf8" },
  diagram: { bg: "rgba(16,185,129,0.9)", ring: "rgba(16,185,129,0.3)", text: "#34d399" },
  code: { bg: "rgba(245,158,11,0.9)", ring: "rgba(245,158,11,0.3)", text: "#fbbf24" },
  formula: { bg: "rgba(239,68,68,0.9)", ring: "rgba(239,68,68,0.3)", text: "#f87171" },
  term: { bg: "rgba(168,85,247,0.9)", ring: "rgba(168,85,247,0.3)", text: "#c084fc" },
  visual: { bg: "rgba(6,182,212,0.9)", ring: "rgba(6,182,212,0.3)", text: "#22d3ee" },
};
const defaultColor = categoryColors.concept;
const getColor = (cat) => categoryColors[cat] || defaultColor;

/* ═══════════════════════════════════════════════════
   YouTube helpers
   ═══════════════════════════════════════════════════ */
function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const check = setInterval(() => {
      if (window.YT && window.YT.Player) { clearInterval(check); resolve(window.YT); }
    }, 100);
  });
}

function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return url.trim().length === 11 ? url.trim() : null;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [learningLog, setLearningLog] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [capturedFramePreview, setCapturedFramePreview] = useState(null);

  const [scanHistory, setScanHistory] = useState([]);
  const [selectedHistoryScan, setSelectedHistoryScan] = useState(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [recommendedChapter, setRecommendedChapter] = useState(null);

  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pauseScanTriggeredRef = useRef(false);

  // Refs so the YT onStateChange closure can read current React state
  const conceptsRef = useRef([]);
  const previewRef = useRef(null);
  const currentTimeRef = useRef(0);

  useEffect(() => { conceptsRef.current = concepts; }, [concepts]);
  useEffect(() => { previewRef.current = capturedFramePreview; }, [capturedFramePreview]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const requestScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" },
      });
      const track = stream.getVideoTracks()[0];
      screenStreamRef.current = track;
      setCaptureReady(true);
      track.onended = () => {
        screenStreamRef.current = null;
        setCaptureReady(false);
      };
    } catch (err) {
      console.error("Screen capture denied:", err);
      setError("Screen capture permission is required for frame scanning.");
    }
  };

  const captureFrame = async () => {
    const track = screenStreamRef.current;
    if (!track) throw new Error("Screen capture not active");

    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();

    const playerEl = playerRef.current;
    if (!playerEl) throw new Error("Player element not found");

    const rect = playerEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = bitmap.width / window.screen.width;
    const scaleY = bitmap.height / window.screen.height;

    const canvas = document.createElement("canvas");
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      bitmap,
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height,
    );

    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  };

  /* ── Create / recreate YouTube player ── */
  useEffect(() => {
    if (!videoId) return;
    // Capture startSeconds at the time the effect fires (closure over current value)
    const startAt = startSeconds;
    let player;
    let destroyed = false;

    const init = async () => {
      const YT = await loadYouTubeAPI();
      if (destroyed) return;

      // Destroy old player
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch (e) {}
        playerInstanceRef.current = null;
      }

      // Clear container
      const container = playerRef.current;
      if (!container) return;
      container.innerHTML = '<div id="yt-inner"></div>';

      player = new YT.Player("yt-inner", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          controls: 1,
          playsinline: 1,
          ...(startAt > 0 ? { start: startAt } : {}),
        },
        events: {
          onStateChange: (event) => {
            if (destroyed) return;
            if (event.data === YT.PlayerState.PAUSED) {
              const t = player.getCurrentTime();
              setCurrentTime(t);
              setIsPaused(true);
            } else if (event.data === YT.PlayerState.PLAYING) {
              // Save completed scan to history before clearing
              if (previewRef.current && conceptsRef.current.length > 0) {
                const t = currentTimeRef.current;
                const mins = Math.floor(t / 60);
                const secs = Math.floor(t) % 60;
                const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
                setScanHistory((prev) => [...prev, {
                  id: Date.now(),
                  timestamp: t,
                  timeStr,
                  concepts: conceptsRef.current,
                  preview: previewRef.current,
                }]);
              }
              setIsPaused(false);
              setConcepts([]);
              setSelectedConcept(null);
              setSelectedHistoryScan(null);
              setHasScanned(false);
              setCapturedFramePreview(null);
              pauseScanTriggeredRef.current = false;
            }
          },
        },
      });
      playerInstanceRef.current = player;
    };

    init();
    return () => {
      destroyed = true;
      if (player && player.destroy) {
        try { player.destroy(); } catch (e) {}
      }
    };
  }, [videoId]);

  /* ── Load video (URL or topic) ── */
  const handleLoadVideo = async () => {
    const input = videoUrl.trim();
    if (!input) {
      setError("Enter a YouTube URL or a topic (e.g. Dynamic Programming)");
      return;
    }

    let id = extractVideoId(input);

    // If not a URL, treat as topic and search for a video
    let topicStartSeconds = 0;
    let topicChapter = null;
    if (!id) {
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/video-for-topic?topic=${encodeURIComponent(input)}`);
        const data = await res.json();
        if (data.error || !data.video_id) {
          setError(data.error || "No videos found for that topic. Try a different phrase.");
          return;
        }
        id = data.video_id;
        setVideoUrl(data.url);
        topicStartSeconds = data.start_seconds || 0;
        topicChapter = data.recommended_chapter || null;
      } catch (err) {
        setError("Could not find video. Is the backend running?");
        return;
      }
    }

    setStartSeconds(topicStartSeconds);
    setRecommendedChapter(topicChapter);
    setVideoId(id);
    setConcepts([]);
    setSelectedConcept(null);
    setError(null);
    setIsPaused(false);
    setHasScanned(false);
    setCapturedFramePreview(null);
    setScanHistory([]);
    setSelectedHistoryScan(null);
    pauseScanTriggeredRef.current = false;

    fetch(`${API_BASE}/api/log-watched`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, video_id: id }),
    }).catch((err) => console.warn("log-watched failed:", err));
  };

  /* ── Analyze frame via Anthropic ── */
  const analyzeFrame = useCallback(async () => {
    if (!videoId) return;
    if (!screenStreamRef.current) {
      setError("Screen capture not active. Please enable it first.");
      return;
    }
    setError(null);
    setConcepts([]);
    setSelectedConcept(null);

    try {
      const base64 = await captureFrame();
      setCapturedFramePreview(`data:image/jpeg;base64,${base64}`);
      setLoading(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(ANTHROPIC_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64 },
              },
              {
                type: "text",
                text: DETECT_PROMPT,
              },
            ],
          }],
        }),
      }).finally(() => clearTimeout(timeout));

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Anthropic API error");
      }

      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setConcepts(parsed);
        setHasScanned(true);
      } else {
        setError("No concepts detected. Try pausing on a frame with more visible content.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      if (err.name === "AbortError") {
        setError("Scan timed out — try pausing on a different frame.");
      } else {
        setError("Analysis failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [videoId, currentTime]);

  /* ── Auto-scan on pause ── */
  useEffect(() => {
    if (isPaused && !pauseScanTriggeredRef.current && videoId && !loading) {
      pauseScanTriggeredRef.current = true;
      analyzeFrame();
    }
  }, [isPaused, videoId, loading, analyzeFrame]);

  /* ── Log concept click ── */
  const handleConceptClick = (concept) => {
    setSelectedConcept(concept);
    setLearningLog((prev) => {
      if (prev.find((l) => l.name === concept.name)) return prev;
      return [...prev, {
        name: concept.name,
        category: concept.category,
        timestamp: currentTime,
        videoId,
        learnedAt: new Date().toISOString(),
      }];
    });

    // Persist to backend (fire-and-forget; UI stays instant)
    fetch(`${API_BASE}/api/log-concept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        concept: concept.name,
        category: concept.category || "general",
        video_id: videoId || "",
        timestamp: currentTime,
      }),
    }).catch((err) => console.warn("log-concept failed:", err));
  };

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh",
      background: "#09090b",
      color: "#e4e4e7",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes pulse-ring {
          0% { transform: translate(-50%,-50%) scale(1); opacity:.5; }
          50% { transform: translate(-50%,-50%) scale(2); opacity:0; }
          100% { transform: translate(-50%,-50%) scale(1); opacity:.5; }
        }
        @keyframes pop-in {
          0% { opacity:0; transform: translate(-50%,-50%) scale(0); }
          70% { transform: translate(-50%,-50%) scale(1.15); }
          100% { opacity:1; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes scan {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes fade-in {
          from { opacity:0; transform: translateY(8px); }
          to { opacity:1; transform: translateY(0); }
        }

        .concept-dot:hover {
          transform: translate(-50%,-50%) scale(1.5) !important;
          z-index: 100 !important;
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.5) !important;
        }
        button:hover {
          opacity: 0.9;
        }

        /* Make YouTube iframe fill container */
        #yt-inner, #yt-inner iframe {
          width: 100% !important;
          height: 100% !important;
          border: none;
        }
      `}</style>

      {/* ════════ HEADER ════════ */}
      <header style={{
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>⚡</div>
          <div>
            <h1 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17, fontWeight: 700, color: "#fff",
              letterSpacing: "-0.3px",
            }}>LearnFlow</h1>
            <p style={{
              fontSize: 10, color: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Mono', monospace",
            }}>pause · detect · learn</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {learningLog.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 16,
              fontSize: 11,
              color: "#818cf8",
              fontFamily: "'DM Mono', monospace",
            }}>
              <span style={{ fontWeight: 600 }}>{learningLog.length}</span> learned
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px",
            background: captureReady ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${captureReady ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: 16,
            fontSize: 10,
            color: captureReady ? "#10b981" : "#f87171",
            fontFamily: "'DM Mono', monospace",
            cursor: captureReady ? "default" : "pointer",
          }}
            onClick={captureReady ? undefined : requestScreenCapture}
          >
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: captureReady ? "#10b981" : "#f87171",
            }} />
            {captureReady ? "capture on" : "capture off"}
          </div>
        </div>
      </header>

      {/* ════════ LANDING — no video ════════ */}
      {!videoId && (
        <div style={{
          maxWidth: 580,
          margin: "100px auto",
          padding: "0 28px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 34, fontWeight: 700,
            color: "#fff", marginBottom: 10,
            letterSpacing: "-0.8px",
            lineHeight: 1.15,
          }}>
            Paste a video.<br />Pause to learn.
          </h2>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.3)",
            marginBottom: 36, lineHeight: 1.5,
          }}>
            AI detects every concept on screen and explains it at your level
          </p>

          {!captureReady ? (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={requestScreenCapture}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 8,
                }}
              >Enable Screen Capture</button>
              <p style={{
                fontSize: 11, color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
              }}>
                Required to capture the video frame when you pause
              </p>
            </div>
          ) : (
            <div style={{
              marginBottom: 20, padding: "10px 14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#10b981",
              fontFamily: "'DM Mono', monospace",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#10b981",
              }} />
              Screen capture active
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="YouTube URL or topic (e.g. Dynamic Programming)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadVideo()}
              style={{
                flex: 1,
                padding: "13px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontFamily: "'DM Mono', monospace",
              }}
            />
            <button
              onClick={handleLoadVideo}
              style={{
                padding: "13px 24px",
                background: captureReady
                  ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                  : "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 10,
                color: captureReady ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 14,
                fontWeight: 600,
                cursor: captureReady ? "pointer" : "default",
                fontFamily: "'DM Sans', sans-serif",
              }}
              disabled={!captureReady}
            >Load →</button>
          </div>
          {error && (
            <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>{error}</p>
          )}
        </div>
      )}

      {/* ════════ MAIN LAYOUT ════════ */}
      {videoId && (
        <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>

          {/* ──── VIDEO SIDE ──── */}
          <div style={{
            flex: 1, padding: "20px 20px 20px 28px",
            display: "flex", flexDirection: "column",
            minWidth: 0,
          }}>
            {/* URL bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoadVideo()}
                placeholder="URL or topic..."
                style={{
                  flex: 1, padding: "9px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, color: "#fff",
                  fontSize: 12, fontFamily: "'DM Mono', monospace",
                }}
              />
              <button onClick={handleLoadVideo} style={{
                padding: "9px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "rgba(255,255,255,0.6)",
                fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>Load</button>
            </div>

            {/* Chapter jump banner */}
            {recommendedChapter && startSeconds > 0 && (
              <div style={{
                marginBottom: 8,
                padding: "7px 14px",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 8,
                fontSize: 12,
                color: "#818cf8",
                fontFamily: "'DM Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⏩</span>
                <span>
                  Jumped to <strong style={{ color: "#a5b4fc" }}>{recommendedChapter.timestamp}</strong>
                  {" — "}{recommendedChapter.label}
                </span>
              </div>
            )}

            {/* Video + overlay container */}
            <div style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: 10,
              overflow: "hidden",
              background: "#000",
              border: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              {/* YouTube player mounts here */}
              <div ref={playerRef} style={{ width: "100%", height: "100%" }} />

              {/* Concept overlay — on top of video when paused */}
              {isPaused && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: loading ? "none" : "auto",
                  zIndex: 20,
                }}>
                  {/* Captured frame covers the iframe entirely — hides YouTube's pause recommendations */}
                  {capturedFramePreview && (
                    <img
                      src={capturedFramePreview}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 1,
                        display: "block",
                      }}
                    />
                  )}
                  {/* Scan animation */}
                  {loading && (
                    <>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.2)",
                        zIndex: 2,
                      }} />
                      <div style={{
                        position: "absolute", left: 0, right: 0, height: 2,
                        background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
                        boxShadow: "0 0 30px rgba(99,102,241,0.5)",
                        animation: "scan 1.2s ease-in-out infinite",
                        zIndex: 3,
                      }} />
                      <div style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%,-50%)",
                        padding: "8px 20px",
                        background: "rgba(0,0,0,0.8)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#818cf8",
                        fontFamily: "'DM Mono', monospace",
                        border: "1px solid rgba(99,102,241,0.3)",
                        zIndex: 3,
                      }}>Scanning frame...</div>
                    </>
                  )}

                  {/* Resume button */}
                  {!loading && (
                    <button
                      onClick={() => playerInstanceRef.current?.playVideo()}
                      style={{
                        position: "absolute",
                        bottom: 14,
                        right: 14,
                        zIndex: 30,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 16px",
                        background: "rgba(0,0,0,0.75)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <span style={{ fontSize: 10 }}>▶</span> Resume
                    </button>
                  )}

                  {/* Concept dots */}
                  {concepts.map((c, i) => {
                    const color = getColor(c.category);
                    const isSelected = selectedConcept?.name === c.name;
                    return (
                      <div key={`${c.name}-${i}`}>
                        {/* Pulse */}
                        <div style={{
                          position: "absolute",
                          left: `${c.x}%`, top: `${c.y}%`,
                          width: 34, height: 34, borderRadius: "50%",
                          border: `2px solid ${color.ring}`,
                          animation: `pulse-ring 2s ease-in-out infinite ${i * 0.2}s`,
                          pointerEvents: "none",
                          transform: "translate(-50%,-50%)",
                        }} />
                        {/* Dot */}
                        <div
                          className="concept-dot"
                          onClick={(e) => { e.stopPropagation(); handleConceptClick(c); }}
                          style={{
                            position: "absolute",
                            left: `${c.x}%`, top: `${c.y}%`,
                            width: isSelected ? 16 : 12,
                            height: isSelected ? 16 : 12,
                            borderRadius: "50%",
                            background: color.bg,
                            border: "2px solid rgba(255,255,255,0.9)",
                            cursor: "pointer",
                            transform: "translate(-50%,-50%)",
                            transition: "all 0.15s",
                            animation: `pop-in 0.35s ease-out ${i * 0.08}s both`,
                            zIndex: isSelected ? 50 : 10,
                            boxShadow: isSelected
                              ? `0 0 0 4px ${color.ring}, 0 0 20px ${color.ring}`
                              : `0 2px 8px rgba(0,0,0,0.5)`,
                          }}
                        />
                        {/* Label */}
                        <div
                          onClick={(e) => { e.stopPropagation(); handleConceptClick(c); }}
                          style={{
                            position: "absolute",
                            left: `${c.x}%`,
                            top: `calc(${c.y}% + 16px)`,
                            transform: "translateX(-50%)",
                            background: isSelected ? color.bg : "rgba(0,0,0,0.85)",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            animation: `pop-in 0.35s ease-out ${i * 0.08 + 0.05}s both`,
                            border: `1px solid ${isSelected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                            fontFamily: "'DM Sans', sans-serif",
                            zIndex: isSelected ? 50 : 10,
                          }}
                        >{c.name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {error && videoId && (
              <div style={{
                marginTop: 10, padding: "8px 14px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 8, fontSize: 12,
                color: "#f87171",
                fontFamily: "'DM Mono', monospace",
              }}>{error}</div>
            )}

            {/* Status bar */}
            <div style={{
              marginTop: 10,
              display: "flex", alignItems: "center", gap: 14,
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'DM Mono', monospace",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isPaused ? "#f59e0b" : "#10b981",
                }} />
                {isPaused ? "paused" : "playing"}
              </span>
              {concepts.length > 0 && <span>{concepts.length} concepts</span>}
              <span>
                {Math.floor(currentTime / 60)}:
                {(Math.floor(currentTime) % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* ──── SIDE PANEL ──── */}
          <div style={{
            width: 340,
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.01)",
          }}>
            {/* History detail view */}
            {selectedHistoryScan && !selectedConcept ? (
              <div style={{
                padding: 20,
                animation: "fade-in 0.2s ease",
                overflowY: "auto",
                flex: 1,
              }}>
                <button
                  onClick={() => setSelectedHistoryScan(null)}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer", fontSize: 11, padding: 0,
                    marginBottom: 14,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >← back</button>

                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase", letterSpacing: "1px",
                  marginBottom: 6,
                  fontFamily: "'DM Mono', monospace",
                }}>Scan at {selectedHistoryScan.timeStr}</div>

                <img
                  src={selectedHistoryScan.preview}
                  alt="Past frame"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "block",
                    marginBottom: 16,
                  }}
                />

                <h3 style={{
                  fontSize: 10, fontWeight: 600,
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  margin: "0 0 10px",
                  fontFamily: "'DM Mono', monospace",
                }}>Concepts · {selectedHistoryScan.concepts.length}</h3>

                {selectedHistoryScan.concepts.map((c, i) => {
                  const color = getColor(c.category);
                  return (
                    <div
                      key={i}
                      className="sidebar-item"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        marginBottom: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        animation: `fade-in 0.2s ease ${i * 0.04}s both`,
                      }}
                    >
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: color.bg, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: "rgba(255,255,255,0.75)",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{c.name}</div>
                        <div style={{
                          fontSize: 11, lineHeight: 1.5,
                          color: "rgba(255,255,255,0.35)",
                          fontFamily: "'DM Sans', sans-serif",
                          marginTop: 2,
                        }}>{c.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Detail view */}
            {selectedConcept ? (
              <div style={{
                padding: 20,
                animation: "fade-in 0.2s ease",
                overflowY: "auto",
                flex: 1,
              }}>
                {capturedFramePreview && isPaused && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase", letterSpacing: "1px",
                      marginBottom: 6,
                      fontFamily: "'DM Mono', monospace",
                    }}>Screenshot sent for analysis</div>
                    <img
                      src={capturedFramePreview}
                      alt="Frame captured"
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "block",
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={() => setSelectedConcept(null)}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer", fontSize: 11, padding: 0,
                    marginBottom: 14,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >← back</button>

                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: getColor(selectedConcept.category).bg,
                  }} />
                  <h2 style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 18, fontWeight: 700, color: "#fff",
                  }}>{selectedConcept.name}</h2>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 5,
                    background: getColor(selectedConcept.category).ring,
                    color: getColor(selectedConcept.category).text,
                    fontSize: 10, fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>{selectedConcept.category}</span>
                  {selectedConcept.difficulty && (
                    <span style={{
                      padding: "3px 8px", borderRadius: 5,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                    }}>{selectedConcept.difficulty}</span>
                  )}
                </div>

                {/* Description */}
                <p style={{
                  fontSize: 13, lineHeight: 1.7,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 20,
                }}>{selectedConcept.description}</p>

                {/* Prerequisites */}
                {selectedConcept.prerequisites?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{
                      fontSize: 10, fontWeight: 600,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase", letterSpacing: "1px",
                      marginBottom: 8,
                      fontFamily: "'DM Mono', monospace",
                    }}>Prerequisites</h4>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {selectedConcept.prerequisites.map((p, i) => (
                        <span key={i} style={{
                          padding: "3px 8px", borderRadius: 5,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontSize: 11, color: "rgba(255,255,255,0.45)",
                          fontFamily: "'DM Mono', monospace",
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next steps placeholder */}
                <div style={{
                  padding: 14,
                  background: "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  borderRadius: 8,
                }}>
                  <p style={{
                    fontSize: 10, color: "rgba(99,102,241,0.6)",
                    textTransform: "uppercase", letterSpacing: "1px",
                    marginBottom: 6, fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                  }}>Coming next</p>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.5,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Practice problems, related video timestamps,
                    and personalized next-step recommendations will appear here.
                  </p>
                </div>

                {learningLog.find((l) => l.name === selectedConcept.name) && (
                  <div style={{
                    marginTop: 14,
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, color: "#10b981",
                    fontFamily: "'DM Mono', monospace",
                  }}>✓ Added to learning log</div>
                )}
              </div>
            ) : (
              !selectedHistoryScan &&
              /* List view */
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 14px" }}>
                {/* Screenshot preview — step 1: see what gets sent */}
                {capturedFramePreview && isPaused && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase", letterSpacing: "1px",
                      marginBottom: 6,
                      fontFamily: "'DM Mono', monospace",
                    }}>Screenshot sent for analysis</div>
                    <img
                      src={capturedFramePreview}
                      alt="Frame captured"
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "block",
                      }}
                    />
                  </div>
                )}

                {concepts.length === 0 && !loading && (
                  <div style={{ textAlign: "center", marginTop: 80, padding: "0 16px" }}>
                    <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.15 }}>⏸</div>
                    <p style={{
                      fontSize: 13, color: "rgba(255,255,255,0.2)",
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.5,
                    }}>
                      Pause the video at any point.<br />
                      AI will detect concepts on screen.
                    </p>
                  </div>
                )}

                {loading && (
                  <div style={{ textAlign: "center", marginTop: 80 }}>
                    <div style={{
                      width: 24, height: 24,
                      border: "2px solid rgba(99,102,241,0.2)",
                      borderTopColor: "#6366f1",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      margin: "0 auto 12px",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{
                      fontSize: 12, color: "rgba(255,255,255,0.3)",
                      fontFamily: "'DM Mono', monospace",
                    }}>Detecting concepts...</p>
                  </div>
                )}

                {concepts.length > 0 && (
                  <>
                    <h3 style={{
                      fontSize: 10, fontWeight: 600,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      margin: "0 6px 12px",
                      fontFamily: "'DM Mono', monospace",
                    }}>Detected · {concepts.length}</h3>

                    {concepts.map((c, i) => {
                      const color = getColor(c.category);
                      const isLogged = learningLog.find((l) => l.name === c.name);
                      return (
                        <div
                          key={i}
                          className="sidebar-item"
                          onClick={() => handleConceptClick(c)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            marginBottom: 3,
                            transition: "background 0.15s",
                            animation: `fade-in 0.25s ease ${i * 0.04}s both`,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: color.bg, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600,
                              color: "rgba(255,255,255,0.75)",
                              fontFamily: "'DM Sans', sans-serif",
                            }}>{c.name}</div>
                            <div style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.25)",
                              fontFamily: "'DM Mono', monospace",
                              marginTop: 1,
                            }}>{c.category}{c.difficulty ? ` · ${c.difficulty}` : ""}</div>
                          </div>
                          {isLogged && <span style={{ fontSize: 9, color: "#10b981" }}>✓</span>}
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.12)" }}>→</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Past Scans */}
                {scanHistory.length > 0 && (
                  <div style={{ marginTop: concepts.length > 0 ? 24 : 0 }}>
                    <h3 style={{
                      fontSize: 10, fontWeight: 600,
                      color: "rgba(255,255,255,0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      margin: "0 6px 10px",
                      fontFamily: "'DM Mono', monospace",
                    }}>Past Scans · {scanHistory.length}</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[...scanHistory].reverse().map((scan) => (
                        <div
                          key={scan.id}
                          className="sidebar-item"
                          onClick={() => setSelectedHistoryScan(scan)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.06)",
                            transition: "background 0.15s",
                          }}
                        >
                          <img
                            src={scan.preview}
                            alt={`Scan at ${scan.timeStr}`}
                            style={{
                              width: 64,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 5,
                              border: "1px solid rgba(255,255,255,0.08)",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600,
                              color: "rgba(255,255,255,0.6)",
                              fontFamily: "'DM Mono', monospace",
                            }}>{scan.timeStr}</div>
                            <div style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.25)",
                              fontFamily: "'DM Mono', monospace",
                              marginTop: 2,
                            }}>{scan.concepts.length} concept{scan.concepts.length !== 1 ? "s" : ""}</div>
                          </div>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.12)" }}>→</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Learning log footer */}
            {learningLog.length > 0 && (
              <div style={{
                padding: "14px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <h4 style={{
                  fontSize: 10, fontWeight: 600,
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase", letterSpacing: "1px",
                  marginBottom: 8,
                  fontFamily: "'DM Mono', monospace",
                }}>Learning Log</h4>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {learningLog.map((l, i) => (
                    <span key={i} style={{
                      padding: "2px 7px", borderRadius: 4,
                      background: getColor(l.category).ring,
                      color: getColor(l.category).text,
                      fontSize: 10, fontWeight: 500,
                      fontFamily: "'DM Mono', monospace",
                    }}>{l.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
