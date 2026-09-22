import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DB_DIR / "news.db"

def get_db_connection() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create main articles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guid TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        publication TEXT NOT NULL,
        feed_id TEXT NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        published_at TIMESTAMP NOT NULL,
        excerpt TEXT,
        image_url TEXT,
        author TEXT,
        tags TEXT DEFAULT '[]',
        entities TEXT DEFAULT '[]',
        cluster_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Indices for blazing fast filtering
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_publication ON articles(publication);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(cluster_id);")

    # Full text search table (FTS5)
    cursor.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
        title,
        excerpt,
        publication,
        tags,
        entities,
        content=articles,
        content_rowid=id
    );
    """)

    # Triggers to keep FTS index synchronized
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
        INSERT INTO articles_fts(rowid, title, excerpt, publication, tags, entities)
        VALUES (new.id, new.title, new.excerpt, new.publication, new.tags, new.entities);
    END;
    """)

    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
        INSERT INTO articles_fts(articles_fts, rowid, title, excerpt, publication, tags, entities)
        VALUES ('delete', old.id, old.title, old.excerpt, old.publication, old.tags, old.entities);
    END;
    """)

    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
        INSERT INTO articles_fts(articles_fts, rowid, title, excerpt, publication, tags, entities)
        VALUES ('delete', old.id, old.title, old.excerpt, old.publication, old.tags, old.entities);
        INSERT INTO articles_fts(rowid, title, excerpt, publication, tags, entities)
        VALUES (new.id, new.title, new.excerpt, new.publication, new.tags, new.entities);
    END;
    """)

    conn.commit()
    conn.close()

def upsert_article(article_data: Dict[str, Any]) -> bool:
    """Inserts a new article or updates if necessary. Returns True if inserted."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    tags_json = json.dumps(article_data.get("tags", []))
    entities_json = json.dumps(article_data.get("entities", []))
    
    try:
        cursor.execute("""
        INSERT INTO articles (
            guid, title, link, publication, feed_id, category, category_label,
            published_at, excerpt, image_url, author, tags, entities, cluster_id
        ) VALUES (
            :guid, :title, :link, :publication, :feed_id, :category, :category_label,
            :published_at, :excerpt, :image_url, :author, :tags, :entities, :cluster_id
        ) ON CONFLICT(guid) DO UPDATE SET
            title = excluded.title,
            excerpt = CASE WHEN excluded.excerpt IS NOT NULL AND excluded.excerpt != '' THEN excluded.excerpt ELSE articles.excerpt END,
            image_url = CASE WHEN excluded.image_url IS NOT NULL AND excluded.image_url != '' THEN excluded.image_url ELSE articles.image_url END,
            category = excluded.category,
            category_label = excluded.category_label
        """, {
            "guid": article_data["guid"],
            "title": article_data["title"],
            "link": article_data["link"],
            "publication": article_data["publication"],
            "feed_id": article_data["feed_id"],
            "category": article_data["category"],
            "category_label": article_data["category_label"],
            "published_at": article_data["published_at"],
            "excerpt": article_data.get("excerpt", ""),
            "image_url": article_data.get("image_url", ""),
            "author": article_data.get("author", ""),
            "tags": tags_json,
            "entities": entities_json,
            "cluster_id": article_data.get("cluster_id")
        })
        conn.commit()
        inserted = cursor.rowcount > 0
        return inserted
    except Exception as e:
        print(f"Error inserting article {article_data.get('title')}: {e}")
        return False
    finally:
        conn.close()

def query_articles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    publication: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "newest",
    page: int = 1,
    page_size: int = 30
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    where_clauses = []
    params = {}
    
    if q and q.strip():
        # Match using FTS5
        clean_q = q.replace('"', '""').strip()
        where_clauses.append("articles.id IN (SELECT rowid FROM articles_fts WHERE articles_fts MATCH :search_term)")
        params["search_term"] = f'"{clean_q}"*'
        
    if category and category != "all":
        where_clauses.append("category = :category")
        params["category"] = category
        
    if publication and publication != "all":
        where_clauses.append("publication = :publication")
        params["publication"] = publication
        
    if start_date:
        where_clauses.append("published_at >= :start_date")
        params["start_date"] = start_date
        
    if end_date:
        where_clauses.append("published_at <= :end_date")
        params["end_date"] = end_date

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    
    # Count total matching
    count_sql = f"SELECT COUNT(*) as total FROM articles {where_sql}"
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()["total"]
    
    # Sorting
    sort_sql = "published_at DESC"
    if sort_by == "oldest":
        sort_sql = "published_at ASC"
    elif sort_by == "publication":
        sort_sql = "publication ASC, published_at DESC"
    elif sort_by == "title":
        sort_sql = "title ASC"
        
    offset = (page - 1) * page_size
    query_sql = f"""
    SELECT id, guid, title, link, publication, feed_id, category, category_label,
           published_at, excerpt, image_url, author, tags, entities, cluster_id
    FROM articles
    {where_sql}
    ORDER BY {sort_sql}
    LIMIT :limit OFFSET :offset
    """
    params["limit"] = page_size
    params["offset"] = offset
    
    cursor.execute(query_sql, params)
    rows = cursor.fetchall()
    
    articles = []
    for r in rows:
        articles.append({
            "id": r["id"],
            "guid": r["guid"],
            "title": r["title"],
            "link": r["link"],
            "publication": r["publication"],
            "feed_id": r["feed_id"],
            "category": r["category"],
            "category_label": r["category_label"],
            "published_at": r["published_at"],
            "excerpt": r["excerpt"],
            "image_url": r["image_url"],
            "author": r["author"],
            "tags": json.loads(r["tags"]) if r["tags"] else [],
            "entities": json.loads(r["entities"]) if r["entities"] else [],
            "cluster_id": r["cluster_id"]
        })
        
    conn.close()
    
    return {
        "articles": articles,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1
    }

def get_categories_stats() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT category, category_label, COUNT(*) as count
    FROM articles
    GROUP BY category, category_label
    ORDER BY count DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"category": r["category"], "label": r["category_label"], "count": r["count"]} for r in rows]

def get_publications_stats() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT publication, COUNT(*) as count
    FROM articles
    GROUP BY publication
    ORDER BY count DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"publication": r["publication"], "count": r["count"]} for r in rows]

def get_overview_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total_articles FROM articles")
    total_articles = cursor.fetchone()["total_articles"]
    
    cursor.execute("SELECT MAX(published_at) as latest_article_date FROM articles")
    latest_article_date = cursor.fetchone()["latest_article_date"]
    
    cursor.execute("SELECT COUNT(DISTINCT publication) as total_publications FROM articles")
    total_publications = cursor.fetchone()["total_publications"]
    
    conn.close()
    return {
        "total_articles": total_articles,
        "latest_article_date": latest_article_date,
        "total_publications": total_publications
    }
