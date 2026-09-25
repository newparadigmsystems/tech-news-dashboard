# 📡 TechRadar: Tech News & Substack Research Dashboard

A high-performance, single-page web dashboard built specifically for tech research, trend discovery, and newsletter curation. It aggregates top tech feeds across 7 domains, stores articles locally in SQLite with full-text search (FTS5), and provides instant keyword, date-range, category, and publication filtering.

---

## ⚡ Quick Start

### 1. Launch the Application
From the repository root, run:
```bash
./start.sh
```
This launches:
- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI API & Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

*(Press `Ctrl+C` in your terminal to cleanly stop both backend and frontend servers).*

### 2. Silent Background Mode (macOS)
To run TechRadar silently as a detached background daemon:
```bash
./startclean.sh
```
Run `./startclean.sh` again to cleanly stop the background processes.

---

## 🎯 Features

- **Instant Startup & Live Background Auto-Sync:**
  - **Instant Load:** Renders cached articles immediately from SQLite with sub-millisecond query speed on startup.
  - **Auto-Sync on Launch:** Automatically fetches fresh RSS feeds and runs AI curation in the background upon launch—no need to manually hit refresh.
  - **Real-Time Status Badges:** Visual header indicators show live status (`Fetching Feeds...`, `AI Summarizing (X/Y)...`) and seamlessly refresh the feed when complete.

- **High-Density Stacked Cards:**
  - Featured image with clean fallback thumbnails.
  - Category badge, publication name with color accents, and relative time with full timestamp tooltips.
  - Bold, clickable headlines and sanitized excerpts.
  - **AI Key Takeaways:** Concise, 1-sentence technical takeaways explaining why the story matters for tech writers.
  - **1-Click "Cite" button:** Copies a pre-formatted Markdown citation (e.g. `[Headline](link) — *Source*`) directly to your clipboard for instant pasting into Substack drafts.
  - Direct link button opening the original publication in a new tab.

- **Fast Multi-Criteria Filtering & Search:**
  - **Live Search (`⌘K` or `/`):** Instant search powered by SQLite FTS5 matching headlines, excerpts, entity tags, publications, and AI key takeaways.
  - **7 Core Categories:**
    1. **General Tech** *(Ars Technica, The Verge, TechCrunch, Wired, Hacker News)*
    2. **AI** *(MIT Tech Review AI, VentureBeat AI, Import AI by Jack Clark, MarkTechPost)*
    3. **Cybersecurity** *(BleepingComputer, The Hacker News, Krebs on Security, Dark Reading)*
    4. **Cloud** *(AWS News Blog, Cloudflare Blog, Google Cloud Blog, InfoQ Cloud)*
    5. **Quantum Computing** *(Quantum Computing Report, Physics World Quantum, The Quantum Insider)*
    6. **New & Emerging Tech** *(IEEE Spectrum, Singularity Hub, MIT Technology Review)*
    7. **Tech Commentary & Deep Issues** *(The Pragmatic Engineer, Platformer, Rest of World, Pluralistic)*
  - **Date Ranges:** Defaults to **Past 7 Days** for a clean, current dashboard view. Easily switch to *Today*, *Past 24 Hours*, *Past 48 Hours*, *Past 30 Days*, *All Time*, or use the custom date range picker to search across the full accumulated archive.
  - **Smart Noise Filter:** Excludes events, webinars, workshops, classes, and promo coupon deals from the news feed with 1-click toggle.
  - **Publication Filter:** Filter by specific news source.
  - **Sorting:** Sort by *Newest First*, *Oldest First*, *Publication (A-Z)*, or *Title (A-Z)*.
  - **Pagination:** Customizable articles per page (15, 30, 50, 100).

- **Research Curation Engine (Gemini Integration):**
  - Uses `gemini-3.8-flash` / `gemini-3.7-flash` via Google GenAI SDK.
  - **Technical Key Takeaways:** Generates concise 1-sentence takeaways for tech research and newsletters.
  - **Canonical Category Re-Classification:** Ensures multi-domain news stories are categorized accurately into core domains.
  - **Entity Extraction:** Extracts 2–4 concise entities (companies, core technologies, CVEs, products) that turn into clickable search pills.
  - **Story Clustering:** Detects when multiple outlets report on the same major event.
  - **Free-Tier Friendly:** Batches articles (15 per request) with exponential backoff retry.
  - *Fully optional:* Runs 100% reliably offline or without an API key using heuristic classification.
  - To enable Gemini, add your API key in `backend/.env`:
    ```bash
    GEMINI_API_KEY="your-gemini-api-key"
    ```

- **Automated Database Backups & 1-Click Export:**
  - Automated SQLite online backups on startup and after feed syncs to `backend/data/backups/`.
  - Maintains rolling daily snapshots (`news_backup_YYYYMMDD.db`) keeping the last 7 daily backups.
  - **1-Click "Backup DB" Button:** Header download button lets you export a verified `.db` database snapshot directly to your computer at any time.

---

## 🛠️ Adding or Customizing Feeds

All feeds are managed in `backend/feeds.json`. You can add any RSS or Atom feed:
```json
{
  "id": "my-feed",
  "name": "Custom Publication",
  "url": "https://example.com/feed",
  "category": "ai",
  "category_label": "AI",
  "enabled": true
}
```
Hit the **Refresh** button on the top right of the dashboard to immediately ingest newly added feeds.

---

## 📁 Project Structure

```
tech_news/
├── backend/
│   ├── data/
│   │   ├── news.db       # SQLite database with FTS5 index
│   │   └── backups/      # Automated rolling SQLite backup snapshots
│   ├── venv/             # Python virtual environment
│   ├── feeds.json        # Curated RSS feed definitions across 7 categories
│   ├── database.py       # SQLite connection, schema, FTS5 queries, and backup engine
│   ├── ingestion.py      # Async feed fetcher, image extractor, text sanitizer
│   ├── curator.py        # Gemini research curation pipeline (summaries, tags, clusters)
│   ├── main.py           # FastAPI server, background sync & scheduler
│   └── requirements.txt  # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Header, FilterBar, ArticleCard, Pagination
│   │   ├── utils/        # Date formatters & category color palettes
│   │   ├── App.jsx       # Main single-page application, polling & state
│   │   └── main.jsx      # React entrypoint
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── start.sh              # Single-command launcher for both servers
├── startclean.sh         # Background daemon toggle runner (macOS)
└── README.md
```
