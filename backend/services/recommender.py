import re
from sentence_transformers import SentenceTransformer, util

from services.youtube import search_videos

# Global model reference — populated by lifespan in main.py
_model: SentenceTransformer | None = None


def set_model(model: SentenceTransformer):
    global _model
    _model = model


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


async def get_recommendations(history: list[dict], weak_categories: list[str]) -> list[dict]:
    """
    Given the user's learning history and weakest categories:
    1. Search YouTube for videos on those topics.
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

    # Collect candidate videos from all weak categories
    candidates = []
    seen_ids = set()
    for category in weak_categories:
        videos = search_videos(category, max_results=10)
        for v in videos:
            if v["id"] not in seen_ids:
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
