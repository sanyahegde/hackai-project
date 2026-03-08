#!/usr/bin/env bash
# Seed known concept logs for demo-user so skill-scores has a predictable test case.
#
# API: POST /api/log-concept expects JSON with "concept" (not "concept_name").
# MongoDB concept_logs will have "concept_name" (server copies from "concept").
#
# Expected history after seed: "heap heap heap hash table"
# Expected skill-scores: Heaps highest (likely 100), Hash Tables second, others low; top_gaps = low skills.
#
# Usage: ./scripts/seed_demo_logs.sh [BASE_URL]
# Default: http://127.0.0.1:8000
# Prereq: Backend running (uvicorn main:app --port 8000) and MONGODB_URI set.

set -e
BASE_URL="${1:-http://127.0.0.1:8000}"

echo "Seeding concept logs at $BASE_URL ..."

# 3x Heap
for i in 1 2 3; do
  out=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/log-concept" \
    -H "Content-Type: application/json" \
    -d '{"user_id":"demo-user","video_id":"test-video","concept":"Heap","category":"Heaps","timestamp":10}')
  code=$(echo "$out" | tail -n1)
  body=$(echo "$out" | sed '$d')
  if [ "$code" != "201" ]; then echo "POST log-concept (Heap) failed: HTTP $code $body"; exit 1; fi
  echo "  Heap $i: OK"
done

# 1x Hash Table
out=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/log-concept" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","video_id":"test-video","concept":"Hash Table","category":"Hash Tables","timestamp":12}')
code=$(echo "$out" | tail -n1)
if [ "$code" != "201" ]; then echo "POST log-concept (Hash Table) failed: HTTP $code"; exit 1; fi
echo "  Hash Table: OK"

echo ""
echo "Done. User history = heap heap heap hash table"
echo "GET /api/skill-scores/demo-user:"
resp=$(curl -s "$BASE_URL/api/skill-scores/demo-user")
echo "$resp" | python3 -m json.tool 2>/dev/null || echo "$resp"
