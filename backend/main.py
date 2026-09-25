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

from fastapi.responses import FileResponse
from datetime import datetime

from database import (
    init_db, query_articles, get_categories_stats,
    get_publications_stats, get_overview_stats, classify_and_update_all_articles,
    recategorize_all_articles, backup_database, get_backup_file_path, get_uncurated_count
)
from ingestion import ingest_all_feeds, load_feeds
from curator import run_curation_pipeline, is_gemini_available, is_curating_now, get_curation_progress

# Background scheduler for periodic sync
scheduler = AsyncIOScheduler()
is_refreshing = False

async def run_sync_and_curation():
    """Ingests latest feeds, backs up the DB, and runs AI curation on uncurated articles."""
    global is_refreshing
    import curator
    if is_refreshing:
        print("[Sync] Feed sync already in progress, skipping duplicate request.")
        return
    is_refreshing = True
    try:
        print("[Sync] Fetching latest feeds...")
        res = await ingest_all_feeds()
        new_count = res.get('new_articles_added', 0)
        print(f"[Sync] Ingested {new_count} new articles.")
        # Create an automatic verified snapshot after ingestion
        backup_database()
    except Exception as e:
        print(f"[Sync] Error during feed ingestion: {e}")
    finally:
        is_refreshing = False

    # Run AI curation on uncurated articles
    if is_gemini_available():
        try:
            print("[Sync] Launching AI curation pipeline for uncurated articles...")
            cur_res = await run_curation_pipeline(limit=100)
            print(f"[Sync] Curation complete: {cur_res}")
        except Exception as e:
            print(f"[Sync] Error during AI curation: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB & run noise classification
    print("[Startup] Initializing SQLite database...")
    init_db()
    
    # Create safety backup on startup
    backup_path = backup_database()
    if backup_path:
        print(f"[Startup] Verified database backup created at {backup_path.name}")

    cleaned = classify_and_update_all_articles()
    if cleaned > 0:
        print(f"[Startup] Classified and flagged {cleaned} non-news items (events/deals/workshops).")
    
    # Run intelligent heuristic recategorization across all articles
    recategorized = recategorize_all_articles()
    if recategorized > 0:
        print(f"[Startup] Recategorized {recategorized} articles to appropriate domains.")

    # ALWAYS launch background feed sync + AI curation on startup
    print("[Startup] Launching background startup feed sync & AI curation...")
    asyncio.create_task(run_sync_and_curation())
        
    # Start scheduler (run every 30 minutes)
    scheduler.add_job(run_sync_and_curation, 'interval', minutes=30)
    scheduler.start()
    
    yield
    
    # Shutdown: cleanly shut down scheduler and make final backup
    scheduler.shutdown()
    backup_database()

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
    stats["curation_progress"] = curator.get_curation_progress()
    stats["uncurated_count"] = get_uncurated_count()
    return stats

@app.get("/api/feeds")
def get_feeds():
    return load_feeds()

@app.post("/api/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    global is_refreshing
    import curator
    if is_refreshing or curator.is_curating_now:
        return {"status": "in_progress", "message": "Feed refresh or AI curation is already underway"}
    
    background_tasks.add_task(run_sync_and_curation)
    return {"status": "started", "message": "Feed refresh started in background"}

@app.post("/api/curate")
async def trigger_curate():
    if not is_gemini_available():
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY environment variable is not configured"
        )
    result = await run_curation_pipeline(limit=100)
    return result

@app.post("/api/backup")
def create_backup():
    path = backup_database()
    if not path or not path.exists():
        raise HTTPException(status_code=500, detail="Failed to create database backup")
    return {
        "status": "success",
        "filename": path.name,
        "size_bytes": path.stat().st_size
    }

@app.get("/api/backup/download")
def download_backup():
    path = get_backup_file_path()
    if not path or not path.exists():
        path = backup_database()
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="No backup file available")
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    return FileResponse(
        path=str(path),
        filename=f"techradar_backup_{today_str}.db",
        media_type="application/x-sqlite3"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
