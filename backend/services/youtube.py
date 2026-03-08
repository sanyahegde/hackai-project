from googleapiclient.discovery import build

from config import YOUTUBE_API_KEY


def search_videos(query: str, max_results: int = 10) -> list[dict]:
    """
    Search YouTube for educational videos matching query.
    Returns list of dicts with id, title, description, url.
    """
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not set. Add it to backend/.env")

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    response = youtube.search().list(
        q=query + " tutorial",
        part="snippet",
        type="video",
        maxResults=max_results,
        relevanceLanguage="en",
        safeSearch="strict",
    ).execute()

    videos = []
    for item in response.get("items", []):
        vid_id = item["id"]["videoId"]
        snippet = item["snippet"]
        videos.append({
            "id": vid_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "url": f"https://www.youtube.com/watch?v={vid_id}",
        })
    return videos
