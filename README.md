# LearnFlow

AI video learning tool. Pause any YouTube video — AI detects concepts on screen, explains them, and saves past scans. Optional backend stores learning history and powers recommendations.

**Stack:** React + Vite, Anthropic Claude (browser), YouTube IFrame API, Screen Capture API. Optional: FastAPI backend, MongoDB, sentence-transformers.

---

## Run locally (full stack)

**1. Frontend**

```bash
npm install
```

Create `.env` in the project root with your Anthropic key:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

```bash
npm run dev
```

Open **http://localhost:3000**.

**2. Backend** (for learning history & recommendations)

All backend dependency installs must run inside the backend virtual environment, not system Python:

```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

If sentence-transformers / PyTorch fail due to NumPy compatibility, pin NumPy in the venv:

```bash
cd backend
source venv/bin/activate
pip install numpy==1.26.4
```

Create `backend/.env`:

```
MONGODB_URI=your_mongodb_atlas_uri
YOUTUBE_API_KEY=   # optional, for YouTube search
```

Then:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**. First startup downloads the sentence-transformers model (~80MB, one-time).

---

## Quick start (frontend only)

```bash
npm install
```

Create `.env` in the project root:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

```bash
npm run dev
```

Open http://localhost:3000. Enable screen capture, paste a YouTube URL, pause to scan.

---

## Add to an existing codebase

### 1. Copy the component

Copy `src/App.jsx` into your project (e.g. as `LearnFlow.jsx` or a page component).

### 2. Add the env variable

Add to your app’s env setup (Vite, Next.js, etc.):

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Vite reads `VITE_` prefixed vars. Other frameworks may use `NEXT_PUBLIC_` or similar — the component expects `import.meta.env.VITE_ANTHROPIC_API_KEY`. Adjust the name in the component if your framework uses another convention.

### 3. Dependencies

Only React. No extra packages required.

### 4. YouTube IFrame API

The component loads the YouTube IFrame API via a script tag. No extra setup.

### 5. Screen capture

Uses `navigator.mediaDevices.getDisplayMedia()`. Users must share their screen when prompted. Ensure your app is served over HTTPS in production (or localhost for dev).

### 6. CORS for Anthropic

The app calls Anthropic directly from the browser. Include this header:

```js
"anthropic-dangerous-direct-browser-access": "true"
```

This is documented by Anthropic for browser use. Do not expose your API key in production; use a proxy or backend if needed.

---

## Project structure

```
src/
  App.jsx      # Single self-contained component
  main.jsx     # Entry point
index.html
vite.config.js
.env.example   # Template for .env
```

---

## Build

```bash
npm run build
```

Output is in `dist/`. Deploy as a static site.
