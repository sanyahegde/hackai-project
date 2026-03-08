# LearnLens – Onboarding & Profile

Onboarding and profile creation flow for LearnLens (AI learning companion).  
**Scope:** onboarding only — no dashboard, history, video, recommendations, or auth.

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS  
- **Backend:** FastAPI  
- **Database:** MongoDB Atlas  

---

## Folder structure

```
hackai/
├── README.md
├── backend/
│   ├── .env.example          # Copy to .env and add your MongoDB URL
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py           # FastAPI app, CORS, router
│       ├── database.py       # MongoDB connection
│       ├── models.py         # Pydantic request/response models
│       └── routers/
│           ├── __init__.py
│           └── profile.py    # POST /profile, GET /profile/{user_id}
└── frontend/
    ├── .env.example          # Optional: VITE_API_URL
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── profile.js    # createProfile(), getProfile()
        └── components/
            └── Onboarding.jsx
```

---

## How to run

### 1. MongoDB connection string

- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier is enough).
- In the backend folder, copy the example env file and set your URL:

```bash
cd backend
cp .env.example .env
```

- Open `.env` and set:

```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `<cluster>` with your Atlas credentials and cluster host.  
Optional: set `DATABASE_NAME=learnlens` (this is the default).

**Important:** The MongoDB connection string goes in **`backend/.env`** as `MONGODB_URL`. Never commit `.env`; only commit `.env.example` (without secrets).

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at **http://localhost:8000**.  
Docs: http://localhost:8000/docs  

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**.  
If the API is on another host/port, create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8000
```

---

## API

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | `/profile`         | Create profile (body: role, goal, reason, level, skills, preferences, timePerWeek, resumeText?) |
| GET    | `/profile/{user_id}` | Get profile by id           |
| GET    | `/health`          | Health check                  |

Profile is stored in the **`users`** collection.  
Fields: `id`, `role`, `goal`, `reason`, `level`, `skills`, `preferences`, `timePerWeek`, `resumeText`, `createdAt`.

---

## Frontend behavior

- **First visit:** onboarding form; required fields validated; submit → POST `/profile` → success view with profile summary; `user_id` saved in `localStorage` under `learnlens_user_id`.
- **Return visit (same device):** if `learnlens_user_id` exists, GET `/profile/{user_id}` loads the profile and pre-fills the form / shows the saved summary.
- “Create another profile” clears `localStorage` and resets the form.
