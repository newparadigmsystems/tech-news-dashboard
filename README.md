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

---

## 🎯 Features

- **High-Density Stacked Cards:**
  - Featured image with clean fallback thumbnails.
  - Category badge, publication name with color accents, and relative time with full timestamp tooltips.
  - Bold, clickable headlines and sanitized multi-line excerpts.
  - **1-Click "Cite" button:** Copies a pre-formatted Markdown citation (e.g. `[Headline](link) — *Source*`) directly to your clipboard for instant pasting into Substack drafts.
  - Direct link button opening the original publication in a new tab.

- **Fast Multi-Criteria Filtering & Search:**
  - **Live Search (`⌘K` or `/`):** Instant search powered by SQLite FTS5 (Full-Text Search).
  - **7 Core Categories:**
    1. **General Tech** *(Ars Technica, The Verge, TechCrunch, Wired, Hacker News)*
    2. **AI** *(MIT Tech Review AI, VentureBeat AI, Import AI by Jack Clark, MarkTechPost)*
    3. **Cybersecurity** *(BleepingComputer, The Hacker News, Krebs on Security, Dark Reading)*
    4. **Cloud** *(AWS News Blog, Cloudflare Blog, Google Cloud Blog, InfoQ Cloud)*
    5. **Quantum Computing** *(Quantum Computing Report, Physics World Quantum, The Quantum Insider)*
    6. **New & Emerging Tech** *(IEEE Spectrum, Singularity Hub, MIT Technology Review)*
    7. **Tech Commentary & Deep Issues** *(The Pragmatic Engineer, Platformer, Rest of World, Pluralistic)*
  - **Date Ranges:** Quick presets (*Today*, *Past 24 Hours*, *Past 48 Hours*, *Past 7 Days*, *Past 30 Days*, *All Time*) or a custom date-range picker.
  - **Publication Filter:** Filter by specific news source.
  - **Sorting:** Sort by *Newest First*, *Oldest First*, *Publication (A-Z)*, or *Title (A-Z)*.
  - **Pagination:** Customizable articles per page (15, 30, 50, 100).

- **Research Curation Engine (Gemini Integration):**
  - Strictly focused on data accuracy and research utility (no generated takes or summaries).
  - Background entity extraction (companies, protocols, CVEs) that become clickable filter pills.
  - Multi-outlet story clustering (detects when multiple outlets report on the same event).
  - *Fully optional:* Runs 100% reliably offline or without an API key using heuristic fallbacks.
  - To enable Gemini:
    ```bash
    export GEMINI_API_KEY="your-gemini-api-key"
    ```

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
│   ├── data/             # SQLite database (news.db) with FTS5 index
│   ├── venv/             # Python virtual environment
│   ├── feeds.json        # Curated RSS feed definitions across 7 categories
│   ├── database.py       # SQLite connection, schema, FTS5 queries, and aggregations
│   ├── ingestion.py      # Async feed fetcher, image extractor, text sanitizer
│   ├── curator.py        # Optional Gemini research curation pipeline
│   ├── main.py           # FastAPI server & background scheduler
│   └── requirements.txt  # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Header, FilterBar, ArticleCard, Pagination
│   │   ├── utils/        # Date formatters & category color palettes
│   │   ├── App.jsx       # Main single-page application & state
│   │   └── main.jsx      # React entrypoint
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── start.sh              # Single-command launcher for both servers
└── README.md
```
