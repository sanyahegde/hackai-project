import re
from sentence_transformers import SentenceTransformer, util

from services.youtube import search_videos, get_full_description

# Global model reference — populated by lifespan in main.py
_model: SentenceTransformer | None = None


def set_model(model: SentenceTransformer):
    global _model
    _model = model


def _timestamp_to_seconds(ts: str) -> int:
    """Convert '4:32' or '1:04:32' to total seconds."""
    parts = ts.strip().split(":")
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return 0
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0


async def get_video_for_topic(topic: str) -> dict | None:
    """Search YouTube for a topic, rank with sentence-transformers, return the best video.
    Also extracts chapters and picks the most relevant one as the start point."""
    if not topic or not topic.strip():
        return None
    if _model is None:
        raise RuntimeError("sentence-transformers model not loaded yet.")
    videos = search_videos(topic.strip(), max_results=5)
    if not videos:
        return None
    topic_emb = _model.encode(topic.strip(), convert_to_tensor=True)
    video_texts = [f"{v['title']} {v['description'][:500]}" for v in videos]
    video_embs = _model.encode(video_texts, convert_to_tensor=True)
    scores = util.cos_sim(topic_emb, video_embs)[0]
    best_idx = int(scores.argmax())
    v = videos[best_idx]

    # Fetch the full description to get chapters (search snippet is truncated)
    full_desc = get_full_description(v["id"])
    chapters = _extract_chapters(full_desc)
    best_chapter = _best_chapter(chapters, topic.strip())
    start_seconds = _timestamp_to_seconds(best_chapter["timestamp"]) if best_chapter else 0

    return {
        "video_id": v["id"],
        "title": v["title"],
        "url": v["url"],
        "start_seconds": start_seconds,
        "recommended_chapter": best_chapter,
    }


def _extract_chapters(description: str) -> list[dict]:
    """
    Extract timestamp chapters from a YouTube video description.
    Handles formats: 0:00, 1:23, 12:34, 1:23:45 followed by a label.
    """
    pattern = r"(?:^|\n)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+)"
    matches = re.findall(pattern, description)
    chapters = []
    for ts, label in matches:
        chapters.append({"timestamp": ts.strip(), "label": label.strip()})
    return chapters


def _best_chapter(chapters: list[dict], gap_query: str) -> dict | None:
    """Rank chapters by semantic similarity to the gap query; return the best one."""
    if not chapters or _model is None:
        return None

    labels = [c["label"] for c in chapters]
    chapter_embeddings = _model.encode(labels, convert_to_tensor=True)
    query_embedding = _model.encode(gap_query, convert_to_tensor=True)

    scores = util.cos_sim(query_embedding, chapter_embeddings)[0]
    best_idx = int(scores.argmax())
    return {**chapters[best_idx], "relevance": round(float(scores[best_idx]), 3)}


async def get_recommendations(
    history: list[dict], weak_categories: list[str],     watched_video_ids: set[str] | None = None
) -> list[dict]:
    """
    Given the user's learning history and weakest categories:
    1. Search YouTube for videos on those topics.
    2. Exclude videos the user has already watched (in watched_video_ids).
    2. Build user profile text from history.
    3. Encode user profile + video titles/descriptions.
    4. Rank by cosine similarity.
    5. Extract chapters and find the most relevant one per video.
    Return top 5 results.
    """
    if _model is None:
        raise RuntimeError("sentence-transformers model not loaded yet — server may still be starting up.")

    # Build user profile string from history
    concept_texts = [
        f"{doc.get('concept', '')} {doc.get('category', '')}"
        for doc in history
    ]
    user_profile = " ".join(concept_texts)

    watched_ids = watched_video_ids or set()

    # Collect candidate videos from all weak categories (exclude already watched)
    candidates = []
    seen_ids = set()
    for category in weak_categories:
        videos = search_videos(category, max_results=10)
        for v in videos:
            if v["id"] not in seen_ids and v["id"] not in watched_ids:
                seen_ids.add(v["id"])
                candidates.append({**v, "gap_category": category})

    if not candidates:
        return []

    # Encode user profile and each video's title + description
    user_embedding = _model.encode(user_profile, convert_to_tensor=True)
    video_texts = [f"{v['title']} {v['description']}" for v in candidates]
    video_embeddings = _model.encode(video_texts, convert_to_tensor=True)

    scores = util.cos_sim(user_embedding, video_embeddings)[0]

    # Rank and take top 5
    ranked = sorted(
        zip(scores.tolist(), candidates),
        key=lambda x: x[0],
        reverse=True,
    )[:5]

    results = []
    for score, video in ranked:
        chapters = _extract_chapters(video["description"])
        best = _best_chapter(chapters, video["gap_category"])
        results.append({
            "title": video["title"],
            "url": video["url"],
            "relevance_score": round(score, 3),
            "gap_category": video["gap_category"],
            "reason": f"Highly relevant to your weakest area: {video['gap_category']}",
            "chapters": chapters,
            "recommended_chapter": best,
        })

    return results
