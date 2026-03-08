# LearnFlow

Frontend-only AI video learning tool. Pause any YouTube video — AI detects concepts on screen, explains them, and saves past scans so you can revisit later.

**Stack:** React + Vite, Anthropic Claude (direct from browser), YouTube IFrame API, Screen Capture API.

---

## Quick start

```bash
npm install
```

Create `.env` in the project root:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

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
