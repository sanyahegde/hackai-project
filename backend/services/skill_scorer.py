from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from skill_map import SKILL_MAP


def compute_skill_scores(history: list[dict]) -> dict[str, float]:
    """
    Given a list of logged concept docs (each has 'concept' and 'category'),
    compute a 0-100 score per skill map category using TF-IDF cosine similarity.
    Low score = weak area / gap.
    """
    # Build one text doc per concept click: "concept_name category"
    user_text = " ".join(
        f"{doc.get('concept', '')} {doc.get('category', '')}"
        for doc in history
    )

    categories = list(SKILL_MAP.keys())
    category_docs = [" ".join(kws) for kws in SKILL_MAP.values()]

    # Corpus = [user_doc] + all category docs
    corpus = [user_text] + category_docs

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    user_vec = tfidf_matrix[0]
    category_vecs = tfidf_matrix[1:]

    similarities = cosine_similarity(user_vec, category_vecs)[0]

    # Normalize max similarity to 100 so scores are relative to the user's strongest area
    max_sim = similarities.max()
    if max_sim == 0:
        scores = {cat: 0.0 for cat in categories}
    else:
        scores = {
            cat: round(float(sim / max_sim) * 100, 1)
            for cat, sim in zip(categories, similarities)
        }

    return scores
