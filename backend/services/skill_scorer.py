"""
TF-IDF + cosine similarity skill scoring from concept click logs.
Recommendations are based ONLY on what the user actually clicked (no untouched skills).
"""

from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from skill_map import SKILL_MAP


def build_user_history_text(logs: list[dict]) -> str:
    """
    Build a single text document from the learning log for TF-IDF.
    Each clicked concept_name is repeated by its click count so that
    frequently clicked concepts get higher weight.
    Example: 3x "Heap", 1x "Hash Table" -> "heap heap heap hash table"
    """
    if not logs:
        return ""
    counts = Counter()
    for log in logs:
        name = (log.get("concept_name") or log.get("concept") or "").strip()
        if name:
            counts[name] += 1
    tokens = []
    for concept_name, count in counts.items():
        tokens.extend([concept_name.lower()] * count)
    return " ".join(tokens)


def get_most_clicked_concept(logs: list[dict]) -> str | None:
    """Return the concept_name that was clicked most often, or None if no logs."""
    if not logs:
        return None
    counts = Counter()
    for log in logs:
        name = (log.get("concept_name") or log.get("concept") or "").strip()
        if name:
            counts[name] += 1
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def compute_skill_scores_from_logs(logs: list[dict]) -> tuple[list[dict], list[str], str | None, str]:
    """
    Compare user history (from concept logs) to each skill document using TF-IDF.
    Only skills with non-zero overlap (touched by the user) are returned or used for recommendations.
    Returns:
      - scores: list of { "skill", "score" } for skills with score > 0, sorted descending
      - top_gaps: among touched skills only, the lowest-scoring (up to 3)
      - learn_next: top-scoring skill from the user's click data (highest matched skill)
      - reason: human-readable explanation based on most-clicked concept
    """
    skill_names = list(SKILL_MAP.keys())
    skill_docs = [SKILL_MAP[name] for name in skill_names]

    user_text = build_user_history_text(logs)
    most_clicked = get_most_clicked_concept(logs)

    if not user_text.strip():
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."

    # Corpus: [user_doc] + skill_docs
    corpus = [user_text] + skill_docs
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    user_vec = tfidf_matrix[0]
    skill_vecs = tfidf_matrix[1:]
    similarities = cosine_similarity(user_vec, skill_vecs)[0]

    max_sim = float(similarities.max())
    if max_sim <= 0:
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."

    # Build scores; only include skills with STRICT positive overlap (never untouched skills)
    raw_scores = [
        {"skill": name, "score": round((float(sim) / max_sim) * 100)}
        for name, sim in zip(skill_names, similarities)
    ]
    touched = [x for x in raw_scores if x["score"] > 0]
    # Defensive: never recommend or return zero-score skills (Arrays, etc. when user never clicked them)
    if not touched:
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."
    touched.sort(key=lambda x: x["score"], reverse=True)
    scores_list = touched

    # learn_next = top-scoring skill from click data only (never from full skill map)
    learn_next = touched[0]["skill"]

    # top_gaps = among touched skills only, weakest first (up to 3)
    by_score_asc = sorted(touched, key=lambda x: x["score"])
    top_gaps = [x["skill"] for x in by_score_asc[:3]]

    # Reason based on most-clicked concept
    if most_clicked and learn_next:
        reason = (
            f"You clicked {most_clicked} most often, so this is the strongest signal for what to learn next."
        )
    elif learn_next:
        reason = f"Based on your concept clicks, the next focus is {learn_next}."
    else:
        reason = "Click concept bubbles while watching videos to get recommendations."

    return scores_list, top_gaps, learn_next, reason
