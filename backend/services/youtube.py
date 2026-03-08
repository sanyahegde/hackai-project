from googleapiclient.discovery import build

from config import YOUTUBE_API_KEY


def _get_youtube():
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not set. Add it to backend/.env")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def search_videos(query: str, max_results: int = 10) -> list[dict]:
    """
    Search YouTube for educational videos matching query.
    Returns list of dicts with id, title, description (short snippet), url.
    Filters for educational programming/tech content only.
    """
    youtube = _get_youtube()
    
    # Enhanced query to get educational programming content
    search_query = f"{query} tutorial programming explained"
    
    response = youtube.search().list(
        q=search_query,
        part="snippet",
        type="video",
        maxResults=max_results * 2,  # Get more to filter
        relevanceLanguage="en",
        safeSearch="strict",
        videoDuration="medium",  # Filters out shorts (< 4 min)
        videoDefinition="high",
    ).execute()

    videos = []
    for item in response.get("items", []):
        vid_id = item["id"]["videoId"]
        snippet = item["snippet"]
        title = snippet.get("title", "").lower()
        description = snippet.get("description", "").lower()
        
        # Filter out non-educational content
        skip_keywords = [
            "shorts", "drawing", "art", "sketch", "paint", "craft",
            "music", "song", "dance", "vlog", "reaction", "unboxing",
            "review", "gameplay", "let's play", "stream", "live"
        ]
        
        # Check if it's educational programming content
        educational_keywords = [
            "tutorial", "learn", "course", "explained", "guide",
            "programming", "coding", "algorithm", "data structure",
            "computer science", "software", "development"
        ]
        
        # Skip if contains skip keywords
        if any(keyword in title or keyword in description for keyword in skip_keywords):
            continue
            
        # Only include if it has educational keywords
        if not any(keyword in title or keyword in description for keyword in educational_keywords):
            continue
        
        videos.append({
            "id": vid_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "url": f"https://www.youtube.com/watch?v={vid_id}",
        })
        
        if len(videos) >= max_results:
            break
    
    return videos


def get_full_description(video_id: str) -> str:
    """Fetch the full description of a single video (contains chapters if present)."""
    youtube = _get_youtube()
    response = youtube.videos().list(
        part="snippet",
        id=video_id,
    ).execute()
    items = response.get("items", [])
    if not items:
        return ""
    return items[0]["snippet"].get("description", "")
