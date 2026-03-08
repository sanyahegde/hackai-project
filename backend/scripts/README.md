# Backend scripts

## What to do right now

### 1. Find the DB name

In the backend, the database name is set in **`config.py`**:

- `MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "learnflow")`

So the app uses the **`learnflow`** database unless you set `MONGODB_DB_NAME` in `backend/.env` (e.g. to `learnlens` or `hackai`).

In Atlas: open your cluster → **Refresh** → expand the cluster. You should see that database (e.g. **learn-cluster → learnflow**). Collections: **concept_logs**, **profiles**, etc.

### 2. Make sure the backend is running

```bash
cd /Users/sanyahegde/Desktop/hackai-project/backend
source venv/bin/activate
uvicorn main:app --port 8000
```

Then in another terminal:

```bash
curl http://127.0.0.1:8000/health
```

If you get `{"status":"ok"}`, the backend is up.

### 3. Force one known write

You can send either **`concept`** or **`concept_name`** in the JSON; the server stores it in MongoDB as **`concept_name`**.

```bash
curl -X POST "http://127.0.0.1:8000/api/log-concept" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo-user",
    "video_id": "test-video",
    "concept_name": "Heap",
    "category": "Heaps",
    "timestamp": 10
  }'
```

Run it a couple more times if you want (3× Heap + 1× Hash Table is the known test case below).

### 4. Refresh Atlas

In the Atlas left sidebar: click the cluster → **Refresh** → expand the cluster again. You should see the **learnflow** (or your DB name) database and inside it **concept_logs** with the new documents.

---

## Known test case: demo-user skill scores

Seed concept logs so `GET /api/skill-scores/demo-user` has a predictable result.

**API:** You can send **`concept`** or **`concept_name`** in the body; the server stores it as **`concept_name`** in MongoDB.

### 1. Start the backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Ensure `backend/.env` has `MONGODB_URI` so logs are written to Atlas.

### 2. Seed logs (manual curl)

**3× Heap:**

```bash
curl -X POST "http://127.0.0.1:8000/api/log-concept" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","video_id":"test-video","concept":"Heap","category":"Heaps","timestamp":10}'
```

Run that three times (or use a loop). Then **1× Hash Table:**

```bash
curl -X POST "http://127.0.0.1:8000/api/log-concept" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","video_id":"test-video","concept":"Hash Table","category":"Hash Tables","timestamp":12}'
```

### 3. Or run the script

```bash
./scripts/seed_demo_logs.sh
# Or: ./scripts/seed_demo_logs.sh http://127.0.0.1:8000
```

### 4. Expected outcome

- **User history (TF-IDF input):** `heap heap heap hash table`
- **GET /api/skill-scores/demo-user:**
  - **Heaps** should be highest (likely **100**)
  - **Hash Tables** second (e.g. 40–50)
  - Other skills (Arrays, Strings, Graphs, etc.) **low or 0**
  - **top_gaps:** three lowest-scoring skills (e.g. Arrays, Strings, Sorting)
  - **learn_next:** one of those low skills (e.g. Arrays)

### 5. Check MongoDB (Atlas)

In Atlas, open your app database and the **concept_logs** collection. You should see documents like:

```json
{
  "user_id": "demo-user",
  "video_id": "test-video",
  "concept_name": "Heap",
  "category": "Heaps",
  "timestamp": 10,
  "clicked_at": "2025-..."
}
```

If logs are not there, the backend cannot write (check `MONGODB_URI`) and the scorer has nothing to read.
