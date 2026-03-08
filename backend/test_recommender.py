#!/usr/bin/env python3
"""
Test: given a term like "Dynamic Programming", does the ML pipeline return a YouTube video?
Usage: python test_recommender.py "Dynamic Programming"
"""
import sys
import os
from pathlib import Path

# Load env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from services.youtube import search_videos
from sentence_transformers import SentenceTransformer, util

def main():
    term = sys.argv[1] if len(sys.argv) > 1 else "Dynamic Programming"
    print(f"Input term: {term}")
    print()

    # 1. YouTube search
    print("1. Searching YouTube...")
    videos = search_videos(term, max_results=5)
    if not videos:
        print("   No videos found. Check YOUTUBE_API_KEY.")
        return
    print(f"   Found {len(videos)} videos")
    print()

    # 2. Load model and rank by relevance to term
    print("2. Loading sentence-transformers model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("   Model loaded")

    term_emb = model.encode(term, convert_to_tensor=True)
    video_texts = [f"{v['title']} {v['description'][:500]}" for v in videos]
    video_embs = model.encode(video_texts, convert_to_tensor=True)
    scores = util.cos_sim(term_emb, video_embs)[0]

    # 3. Output top video
    best_idx = int(scores.argmax())
    best = videos[best_idx]
    score = float(scores[best_idx])
    print()
    print("3. Top recommended video:")
    print(f"   Title: {best['title']}")
    print(f"   URL:   {best['url']}")
    print(f"   Score: {score:.3f}")
    print()
    print("OK - pipeline works")

if __name__ == "__main__":
    main()
