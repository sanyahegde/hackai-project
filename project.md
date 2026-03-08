# LearnFlow

AI-powered video learning tool that turns passive watching into active, personalized learning for professionals.

## One Sentence

Pause any video, AI detects every concept on screen, click to learn, and get told what to study next.

## Who It's For

Professionals upskilling, switching roles, or getting certified who don't have time to sit through full courses.

## How It Works

User sets a profile (role, existing skills, learning goal). System recommends videos based on their gaps. User watches a video. User pauses. AI instantly scans the screen, detects every concept visible, and overlays clickable dots on the video. User clicks a concept — gets an explanation calibrated to what they already know. Every click is logged. A radar chart tracks their skill progress. The system identifies weak areas and recommends what to watch next. Repeat.

## Core Loop

```
Profile → Watch video → Pause → AI scans frame → Clickable concepts appear
→ Click to learn → Logged to history → Skill scores update → Radar chart updates
→ Gaps identified → New videos recommended → Watch next video → Repeat
```

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI (Python)
- Database: MongoDB Atlas
- AI Vision: Claude API (image analysis on pause)
- Voice: ElevenLabs (reads explanations aloud)
- Recommendation: sentence-transformers (all-MiniLM-L6-v2) + TF-IDF (scikit-learn)
- Video Search: YouTube Data API

## Features

### 1. Screen Capture + Pause Detection

On app load, user grants screen capture permission once. Stream stays open all session. YouTube video embeds via IFrame API. When user pauses, app grabs the exact frame from the screen capture stream, crops to the video player area, converts to base64, sends to Claude API. No downloading, no yt-dlp, instant capture.

### 2. Concept Detection + Overlay

Claude vision analyzes the frame and returns a JSON array of detected concepts with names, descriptions, positions (x/y percentages), categories, difficulty levels, and prerequisites. Frontend renders colored clickable dots at those positions on top of the paused video. Each dot has a pulsing ring animation and a label.

### 3. Click to Learn

User clicks a concept dot. Side panel shows the concept name, category tag, difficulty tag, description calibrated to the user's level, and prerequisites. If ElevenLabs is enabled, the explanation is read aloud. The click is logged to MongoDB with user_id, concept name, category, video_id, and timestamp.

### 4. User Profile

On first visit, user enters their role, existing skills, learning goal, and skill level. Stored in MongoDB. This profile is injected into the AI prompt so explanations match their experience level. A backend developer clicking "recursion" gets a different explanation than a beginner.

### 5. Skill Radar Chart

A predefined skill map exists for the user's learning goal. Example for DSA: Binary Search, Backtracking, Two Pointers, BFS, DFS, Dynamic Programming, Graph, Priority Queue, Sorting, etc. TF-IDF compares the user's clicked concepts against skill map categories. Each category gets a score from 0-100. Frontend renders a radar chart using Recharts. High score = strong area (extends outward). Low score = gap (stays near center). Updates after every session.

### 6. Gap Detection

Backend sorts skill scores lowest first. The weakest areas are the user's learning gaps. These gaps drive the recommendation engine. "Your biggest gap is Dynamic Programming at 12%. Here's what to watch."

### 7. YouTube Video Recommendations

sentence-transformers (all-MiniLM-L6-v2) loads once on server startup. When recommendations are requested, the backend takes the user's gaps, searches YouTube Data API for educational videos on those topics, encodes the user's profile + learning history as one vector, encodes each video's title + description as vectors, and ranks by cosine similarity. Top 5 returned with relevance scores and reasoning.

### 8. Timestamp/Chapter Recommendations

Many YouTube videos have chapters in their description (like "0:00 Intro, 4:32 Topic"). Backend extracts these with regex from the YouTube API response. sentence-transformers ranks which chapters are most relevant to the user's specific gap. Result: "Skip to 4:32 — that section covers exactly what you're missing."

### 9. ElevenLabs Voice

When user clicks a concept, the explanation text is sent to ElevenLabs text-to-speech API. Audio plays automatically. One API call, one voice (Rachel), clean and professional. Toggle on/off with a speaker icon.

### 10. Learning History

Every interaction saved to MongoDB: user_id, video_id, concept clicked, category, timestamp, datetime. This history feeds the skill scoring, gap detection, and recommendation engine. The more they use it, the smarter it gets.

## API Endpoints

```
POST /api/profile          — create/update user profile
GET  /api/profile/{id}     — get user profile
POST /api/analyze-frame    — send base64 image, get detected concepts
POST /api/log-concept      — log a concept click
GET  /api/skill-scores/{id} — get radar chart data
GET  /api/recommendations/{id} — get recommended videos
GET  /api/learning-history/{id} — get all logged concepts
POST /api/speak             — send text, get ElevenLabs audio back
```

## ML Models (Ensemble)

**Model 1: sentence-transformers (all-MiniLM-L6-v2)**
Job: YouTube video recommendations + chapter ranking.
Why: Understands meaning. "gradient descent" and "optimization algorithm" are recognized as related even though they share no words. Works with zero training data. Pretrained on 1B+ text pairs.

**Model 2: TF-IDF + cosine similarity (scikit-learn)**
Job: Skill scoring for radar chart + gap detection.
Why: Skill maps are keyword-driven. Exact term matching matters more than semantic understanding here. "Binary search" should match "Binary Search" category directly. Lightweight, instant, no model download.

**Why two models:** Video descriptions are messy natural language — needs semantic understanding. Skill maps are structured keywords — needs exact matching. Right tool for each job.

## Hackathon Tracks Hit

1. AI Learning Recommendation System — primary track, checks every requirement
2. UX Design Challenge — the pause-click-learn interaction is the UX story
3. Best Use of Gemini/Claude API — vision analysis on every pause
4. Best Use of MongoDB Atlas — profiles, history, recommendations all stored
5. Best Use of ElevenLabs — voice reads explanations aloud
6. Data Science/ML — two ML models in an ensemble architecture
7. General Track — automatic entry


That's the whole product. Pause. Learn. Repeat.