import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
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

export default function App() {
  const [searchParams] = useSearchParams();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captureReady, setCaptureReady] = useState(false);

  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Pre-fill from URL
  useEffect(() => {
    const video = searchParams.get("video");
    if (video && video.trim().length === 11) {
      setVideoUrl(`https://www.youtube.com/watch?v=${video}`);
      setVideoId(video);
    }
  }, [searchParams]);

  // Load YouTube API
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // Request screen capture
  const requestCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = stream.getVideoTracks()[0];
      setCaptureReady(true);
      screenStreamRef.current.onended = () => {
        screenStreamRef.current = null;
        setCaptureReady(false);
      };
    } catch (err) {
      setError("Screen capture denied");
    }
  };

  // Capture frame
  const captureFrame = async () => {
    if (!screenStreamRef.current) throw new Error("No capture");

    const imageCapture = new ImageCapture(screenStreamRef.current);
    const bitmap = await imageCapture.grabFrame();

    const playerEl = playerRef.current;
    const rect = playerEl.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    const scaleX = bitmap.width / window.screen.width;
    const scaleY = bitmap.height / window.screen.height;

    ctx.drawImage(
      bitmap,
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  };

  // Analyze frame
  const analyze = useCallback(async () => {
    if (!captureReady) return;

    setLoading(true);
    setError(null);
    setConcepts([]);

    try {
      const base64 = await captureFrame();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data: base64 },
                },
                {
                  type: "text",
                  text: `Analyze this educational video frame. Return ONLY a JSON array of concepts you see. Each item: {"name":"short name","description":"brief explanation","x":0-100,"y":0-100}. No markdown, just JSON.`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setConcepts(parsed);
      } else {
        setError("No concepts detected");
      }
    } catch (err) {
      setError("Analysis failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [captureReady]);

  // Load video
  const loadVideo = () => {
    const id = videoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
    if (!id) {
      setError("Invalid YouTube URL");
      return;
    }

    setVideoId(id);
    setConcepts([]);
    setError(null);
  };

  // Create YouTube player
  useEffect(() => {
    if (!videoId || !window.YT) return;

    const container = playerRef.current;
    if (!container) return;

    container.innerHTML = '<div id="yt-player"></div>';

    const player = new window.YT.Player("yt-player", {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 1, controls: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PAUSED) {
            setIsPaused(true);
            setTimeout(analyze, 500);
          } else {
            setIsPaused(false);
            setConcepts([]);
          }
        },
      },
    });

    playerInstanceRef.current = player;

    return () => {
      try {
        player.destroy();
      } catch (e) {}
    };
  }, [videoId, analyze]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 20 }}>
      <h1>LearnFlow - Simple</h1>

      {!captureReady ? (
        <div>
          <button onClick={requestCapture} style={{ padding: 10, fontSize: 16 }}>
            Enable Screen Capture
          </button>
          <p style={{ color: "#888" }}>Required to analyze video frames</p>
        </div>
      ) : (
        <p style={{ color: "#0f0" }}>✓ Screen capture ready</p>
      )}

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="YouTube URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadVideo()}
          style={{ padding: 10, width: 400, marginRight: 10 }}
        />
        <button onClick={loadVideo} disabled={!captureReady} style={{ padding: 10 }}>
          Load Video
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {videoId && (
        <div style={{ marginTop: 20, position: "relative", width: 800, height: 450 }}>
          <div ref={playerRef} style={{ width: "100%", height: "100%" }} />

          {isPaused && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 10,
              }}
            >
              {loading && <p style={{ textAlign: "center", marginTop: 200 }}>Analyzing...</p>}

              {concepts.map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    background: "#00f",
                    color: "#fff",
                    padding: "5px 10px",
                    borderRadius: 5,
                    fontSize: 12,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                  onClick={() => alert(c.description)}
                >
                  {c.name}
                </div>
              ))}

              <button
                onClick={() => playerInstanceRef.current?.playVideo()}
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  padding: 10,
                  zIndex: 20,
                }}
              >
                ▶ Resume
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Detected Concepts: {concepts.length}</h3>
        {concepts.map((c, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <strong>{c.name}</strong>: {c.description}
          </div>
        ))}
      </div>
    </div>
  );
}
