import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

from database import get_db_connection

# Load .env file automatically
load_dotenv()

def is_gemini_available() -> bool:
    api_key = os.environ.get("GEMINI_API_KEY")
    return bool(api_key and api_key.strip())

async def run_curation_pipeline(limit: int = 25) -> Dict[str, Any]:
    """
    Curates recent uncurated articles using Gemini.
    Strictly focuses on feed accuracy: entity extraction, topic tags,
    and cross-publication story clustering (detecting multiple outlets covering the same event).
    Does NOT generate content, opinions, or summaries.
    """
    if not is_gemini_available():
        return {
            "status": "skipped",
            "message": "GEMINI_API_KEY not set. Operating with feed-level tags."
        }
        
    try:
        from google import genai
        from google.genai import types
        
        api_key = os.environ.get("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        
        # Fetch recent articles that don't have entities extracted or cluster_id checked
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, title, publication, category, excerpt
        FROM articles
        WHERE entities = '[]' OR entities IS NULL
        ORDER BY published_at DESC
        LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return {"status": "up_to_date", "curated_count": 0}
            
        articles_to_process = [dict(r) for r in rows]
        
        prompt = (
            "You are a technical research assistant curating a tech news database for a researcher. "
            "Your goal is strictly to improve searchability and detect duplicate story coverage across outlets.\n"
            "Given the following list of tech articles (id, title, publication, category, excerpt), perform two tasks:\n"
            "1. Extract 2 to 4 key named entities (companies, core technologies, CVEs, or products) for each article as concise tags.\n"
            "2. Identify if multiple articles in this list are reporting on the EXACT SAME real-world event/news item. "
            "If they are covering the same story, assign them the exact same concise cluster_id (e.g. 'crowdstrike-update-glitch', 'nvidia-blackwell-shipping'). "
            "If an article is standalone or not clearly duplicate, set cluster_id to null.\n\n"
            "Return a strictly valid JSON array of objects with keys: id (number), entities (array of strings), cluster_id (string or null).\n\n"
            f"Articles:\n{json.dumps(articles_to_process, indent=2)}"
        )
        
        response = None
        last_error = None
        for model_name in ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    break
            except Exception as ex:
                last_error = ex
                continue

        if not response or not response.text:
            raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")
        
        results = json.loads(response.text)
        updated_count = 0
        
        for item in results:
            article_id = item.get("id")
            entities = json.dumps(item.get("entities", []))
            cluster_id = item.get("cluster_id")
            
            if article_id:
                cursor.execute("""
                UPDATE articles
                SET entities = ?, cluster_id = COALESCE(?, cluster_id)
                WHERE id = ?
                """, (entities, cluster_id, article_id))
                updated_count += 1
                
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "curated_count": updated_count
        }
    except Exception as e:
        print(f"Curator pipeline error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
