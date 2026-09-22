import os
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
from dotenv import load_dotenv

# Load .env variables
ENV_FILE = Path(__file__).resolve().parent / ".env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
load_dotenv()

from database import (
    init_db, query_articles, get_categories_stats,
    get_publications_stats, get_overview_stats, classify_and_update_all_articles,
    recategorize_all_articles
)
from ingestion import ingest_all_feeds, load_feeds
from curator import run_curation_pipeline, is_gemini_available, is_curating_now

# Background scheduler for periodic sync
scheduler = AsyncIOScheduler()

async def scheduled_feed_sync():
    print("[Scheduler] Running periodic feed sync...")
    try:
        res = await ingest_all_feeds()
        print(f"[Scheduler] Ingested {res.get('new_articles_added', 0)} new articles.")
        if is_gemini_available():
            await run_curation_pipeline(limit=40)
    except Exception as e:
        print(f"[Scheduler] Error during scheduled sync: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB & run noise classification
    print("[Startup] Initializing SQLite database...")
    init_db()
    cleaned = classify_and_update_all_articles()
    if cleaned > 0:
        print(f"[Startup] Classified and flagged {cleaned} non-news items (events/deals/workshops).")
    
    # Run intelligent heuristic recategorization across all articles
    recategorized = recategorize_all_articles()
    if recategorized > 0:
        print(f"[Startup] Recategorized {recategorized} articles to appropriate domains.")

    async def delayed_startup_curation():
        await asyncio.sleep(1)
        if is_gemini_available():
            print("[Startup] Launching background LLM curation for uncurated articles...")
            await run_curation_pipeline(limit=40)

    # Check if DB has any articles; if empty, trigger initial ingestion
    stats = get_overview_stats()
    if stats["total_articles"] == 0:
        print("[Startup] Database is empty. Launching initial feed ingestion...")
        asyncio.create_task(scheduled_feed_sync())
    else:
        asyncio.create_task(delayed_startup_curation())
        
    # Start scheduler (run every 30 minutes)
    scheduler.add_job(scheduled_feed_sync, 'interval', minutes=30)
    scheduler.start()
    
    yield
    
    # Shutdown
    scheduler.shutdown()

app = FastAPI(
    title="Tech News Aggregator API",
    description="High-performance backend for tech news research & Substack curation",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

is_refreshing = False

@app.get("/api/articles")
def get_articles(
    q: Optional[str] = Query(None, description="Keyword search query"),
    category: Optional[str] = Query(None, description="Category filter (ai, cybersecurity, cloud, etc.)"),
    publication: Optional[str] = Query(None, description="Publication name filter"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD or ISO)"),
    sort_by: str = Query("newest", pattern="^(newest|oldest|publication|title)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=5, le=100),
    exclude_noise: bool = Query(True, description="Exclude non-news items like webinars, events, workshops, and promo deals")
):
    return query_articles(
        q=q,
        category=category,
        publication=publication,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
        exclude_noise=exclude_noise
    )

@app.get("/api/categories")
def get_categories(exclude_noise: bool = Query(True)):
    return get_categories_stats(exclude_noise=exclude_noise)

@app.get("/api/publications")
def get_publications(exclude_noise: bool = Query(True)):
    return get_publications_stats(exclude_noise=exclude_noise)

@app.get("/api/stats")
def get_stats():
    import curator
    stats = get_overview_stats()
    stats["gemini_enabled"] = is_gemini_available()
    stats["is_refreshing"] = is_refreshing
    stats["is_curating"] = curator.is_curating_now
    return stats

@app.get("/api/feeds")
def get_feeds():
    return load_feeds()

async def background_refresh_task():
    global is_refreshing
    if is_refreshing:
        return
    is_refreshing = True
    try:
        await ingest_all_feeds()
        if is_gemini_available():
            await run_curation_pipeline(limit=40)
    finally:
        is_refreshing = False

@app.post("/api/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    global is_refreshing
    if is_refreshing:
        return {"status": "in_progress", "message": "Feed refresh already underway"}
    
    background_tasks.add_task(background_refresh_task)
    return {"status": "started", "message": "Feed refresh started in background"}

@app.post("/api/curate")
async def trigger_curate():
    if not is_gemini_available():
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY environment variable is not configured"
        )
    result = await run_curation_pipeline(limit=50)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
