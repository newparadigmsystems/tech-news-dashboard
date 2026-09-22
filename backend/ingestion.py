import asyncio
import json
import re
import html
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import dateutil.parser
import feedparser
import httpx
from bs4 import BeautifulSoup

from database import upsert_article

FEEDS_FILE = Path(__file__).resolve().parent / "feeds.json"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/130.0.0.0 Safari/537.36 TechNewsResearch/1.0"
)

def load_feeds() -> List[Dict[str, Any]]:
    if not FEEDS_FILE.exists():
        return []
    with open(FEEDS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def clean_html_snippet(raw_html: str, max_length: int = 280) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    # Remove script, style, iframe, img
    for tag in soup(["script", "style", "iframe", "img", "figure", "picture"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    
    if len(text) > max_length:
        truncated = text[:max_length].rsplit(" ", 1)[0]
        return truncated + "..."
    return text

def extract_image_url(entry: Any, raw_content: str = "") -> Optional[str]:
    # 1. Check media_content
    if hasattr(entry, "media_content") and entry.media_content:
        for media in entry.media_content:
            if isinstance(media, dict) and "url" in media:
                url = media["url"]
                if any(ext in url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif", "image"]):
                    return url
                    
    # 2. Check media_thumbnail
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        for thumb in entry.media_thumbnail:
            if isinstance(thumb, dict) and "url" in thumb:
                return thumb["url"]

    # 3. Check enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if isinstance(enc, dict):
                href = enc.get("href") or enc.get("url")
                if href and (enc.get("type", "").startswith("image/") or any(ext in href.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"])):
                    return href

    # 4. Check links
    if hasattr(entry, "links") and entry.links:
        for link in entry.links:
            if isinstance(link, dict):
                href = link.get("href", "")
                if link.get("type", "").startswith("image/") or link.get("rel") in ["enclosure", "image"]:
                    return href

    # 5. Extract <img> tag from raw_content, summary, or description
    candidates = []
    if raw_content:
        candidates.append(raw_content)
    if hasattr(entry, "summary"):
        candidates.append(entry.summary)
    if hasattr(entry, "description"):
        candidates.append(entry.description)
        
    for html_str in candidates:
        if not html_str:
            continue
        soup = BeautifulSoup(html_str, "html.parser")
        imgs = soup.find_all("img")
        for img in imgs:
            # Check multiple image attributes (data-src, src, srcset, data-orig-file)
            src = (
                img.get("data-orig-file") or
                img.get("data-src") or
                img.get("data-lazy-src") or
                img.get("src")
            )
            if not src and img.get("srcset"):
                # Take first URL from srcset
                first_part = img.get("srcset").split(",")[0].strip()
                src = first_part.split(" ")[0].strip()
                
            if not src:
                continue
                
            # Exclude tracking pixels or feedburner / gravatar icons
            width = img.get("width")
            height = img.get("height")
            if width in ("1", "0") or height in ("1", "0"):
                continue
            if any(bad in src.lower() for bad in ["feedburner", "doubleclick", "gravatar.com/avatar", "1x1", "pixel"]):
                continue
            if src.startswith("http"):
                return src

    return None

def parse_published_date(entry: Any) -> str:
    # Try published_parsed
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        return dt.isoformat()
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        dt = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
        return dt.isoformat()
    
    # Try string parsing
    for field in ["published", "updated", "pubDate", "created"]:
        val = getattr(entry, field, None)
        if val:
            try:
                dt = dateutil.parser.parse(val)
                if not dt.tzinfo:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat()
            except Exception:
                pass
                
    # Fallback to current time
    return datetime.now(timezone.utc).isoformat()

async def fetch_feed(client: httpx.AsyncClient, feed_meta: Dict[str, Any]) -> List[Dict[str, Any]]:
    url = feed_meta["url"]
    feed_id = feed_meta["id"]
    pub_name = feed_meta["name"]
    category = feed_meta["category"]
    category_label = feed_meta.get("category_label", category.capitalize())
    
    parsed_articles = []
    try:
        response = await client.get(url, timeout=15.0, follow_redirects=True)
        if response.status_code != 200:
            print(f"[{pub_name}] HTTP {response.status_code} fetching {url}")
            return []
            
        content = response.content
        parsed = feedparser.parse(content)
        
        for entry in parsed.entries:
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "").strip()
            if not title or not link:
                continue
                
            guid = getattr(entry, "id", None) or getattr(entry, "guid", None) or link
            published_at = parse_published_date(entry)
            
            raw_summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            raw_content = ""
            if hasattr(entry, "content") and entry.content:
                raw_content = entry.content[0].get("value", "")
                
            excerpt = clean_html_snippet(raw_content or raw_summary)
            image_url = extract_image_url(entry, raw_content or raw_summary)
            author = getattr(entry, "author", "") or pub_name
            
            # Extract tags if available in feed
            tags = []
            if hasattr(entry, "tags") and entry.tags:
                for t in entry.tags:
                    term = t.get("term")
                    if term and len(term) < 40:
                        tags.append(term.strip())
                        
            parsed_articles.append({
                "guid": str(guid),
                "title": title,
                "link": link,
                "publication": pub_name,
                "feed_id": feed_id,
                "category": category,
                "category_label": category_label,
                "published_at": published_at,
                "excerpt": excerpt,
                "image_url": image_url,
                "author": author,
                "tags": tags[:6],
                "entities": [],
                "cluster_id": None
            })
            
    except Exception as e:
        print(f"[{pub_name}] Error parsing feed: {e}")
        
    return parsed_articles

async def ingest_all_feeds() -> Dict[str, Any]:
    feeds = load_feeds()
    enabled_feeds = [f for f in feeds if f.get("enabled", True)]
    
    headers = {"User-Agent": USER_AGENT}
    total_added = 0
    total_fetched = 0
    
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = [fetch_feed(client, f) for f in enabled_feeds]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for feed_articles in results:
            if isinstance(feed_articles, list):
                for article in feed_articles:
                    total_fetched += 1
                    inserted = upsert_article(article)
                    if inserted:
                        total_added += 1
                        
    return {
        "feeds_processed": len(enabled_feeds),
        "total_fetched": total_fetched,
        "new_articles_added": total_added,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
