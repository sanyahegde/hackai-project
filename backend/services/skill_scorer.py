"""
TF-IDF + cosine similarity skill scoring from concept click logs.
Supports multiple domains (DSA, ML, AI Strategy, Cloud).
learn_next is always based on the LAST click for maximum responsiveness.
"""

from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from skill_map import get_skill_map


def build_user_history_text(logs: list[dict]) -> str:
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


def match_concept_to_skill(concept: str, skill_map: dict) -> str | None:
    """Match a concept name to a skill, prioritizing stronger overlaps."""
    concept_lower = concept.lower()
    concept_words = set(concept_lower.split())

    # Pass 1: concept is a substring of the skill name (strongest signal)
    for skill_name in skill_map:
        if concept_lower in skill_name.lower():
            return skill_name

    # Pass 2: skill name is a substring of the concept
    for skill_name in skill_map:
        if skill_name.lower() in concept_lower:
            return skill_name

    # Pass 3: concept is a substring of the keywords
    for skill_name, keywords in skill_map.items():
        if concept_lower in keywords.lower():
            return skill_name

    # Pass 4: multi-word overlap — require at least 2 overlapping words
    # to avoid spurious matches (e.g. "World Wide Web" → AWS via "web")
    best_skill = None
    best_overlap = 0
    for skill_name, keywords in skill_map.items():
        keyword_words = set(keywords.lower().split())
        overlap = len(concept_words & keyword_words)
        if overlap > best_overlap:
            best_overlap = overlap
            best_skill = skill_name
    if best_skill and best_overlap >= 2:
        return best_skill

    return None


def compute_skill_scores_from_logs(
    logs: list[dict],
    domain: str = "dsa",
) -> tuple[list[dict], list[str], str | None, str]:
    """
    1. TF-IDF scores use ALL logs for the radar chart.
    2. learn_next uses the LAST click for immediate responsiveness.
    3. Domain selects which skill map to score against.
    """
    skill_map = get_skill_map(domain)
    skill_names = list(skill_map.keys())
    skill_docs = [skill_map[name] for name in skill_names]

    user_text = build_user_history_text(logs)

    if not user_text.strip():
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."

    corpus = [user_text] + skill_docs
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    user_vec = tfidf_matrix[0]
    skill_vecs = tfidf_matrix[1:]
    similarities = cosine_similarity(user_vec, skill_vecs)[0]

    max_sim = float(similarities.max())
    if max_sim <= 0:
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."

    raw_scores = [
        {"skill": name, "score": round((float(sim) / max_sim) * 100)}
        for name, sim in zip(skill_names, similarities)
    ]
    touched = [x for x in raw_scores if x["score"] > 0]
    if not touched:
        return [], [], None, "Click concept bubbles while watching videos to get recommendations."
    touched.sort(key=lambda x: x["score"], reverse=True)
    scores_list = touched

    by_score_asc = sorted(touched, key=lambda x: x["score"])
    top_gaps = [x["skill"] for x in by_score_asc[:3]]

    # learn_next: walk backwards through logs to find the most recent click
    # that maps to a known skill, so every click triggers an instant update
    learn_next = None
    last_concept = None
    for log in reversed(logs):
        name = (log.get("concept_name") or log.get("concept") or "").strip()
        if not name:
            continue
        if last_concept is None:
            last_concept = name
        matched = match_concept_to_skill(name, skill_map)
        if matched:
            learn_next = matched
            reason = (
                f"You just explored \"{name}\" — "
                f"the system recommends diving deeper into {learn_next}."
            )
            break

    if not learn_next:
        learn_next = touched[0]["skill"]
        reason = f"Based on your concept clicks, the next focus is {learn_next}."

    return scores_list, top_gaps, learn_next, reason
