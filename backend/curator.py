import os
import json
import asyncio
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

from database import get_db_connection
from classifier import CATEGORY_META

# Load .env file automatically from backend directory or cwd
ENV_FILE = Path(__file__).resolve().parent / ".env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
load_dotenv()

# Global state to prevent concurrent curation runs
_curation_lock = asyncio.Lock()
is_curating_now = False

def is_gemini_available() -> bool:
    api_key = os.environ.get("GEMINI_API_KEY")
    return bool(api_key and api_key.strip())

# Recommended model cascade for speed, reasoning, and reliability
MODELS_TO_TRY = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3-flash-preview"
]

curation_progress: Dict[str, int] = {"total": 0, "current": 0}

def get_curation_progress() -> Dict[str, int]:
    return dict(curation_progress)

async def curate_article_batch(client: Any, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sends a batch of articles to Gemini and parses the structured response."""
    from google.genai import types

    articles_payload = [
        {
            "id": a["id"],
            "title": a["title"],
            "publication": a["publication"],
            "current_category": a["category"],
            "excerpt": (a.get("excerpt") or "")[:250]
        }
        for a in articles
    ]

    prompt = (
        "You are an expert technical intelligence assistant curating a tech news database for researchers and tech writers.\n"
        "For each article in the provided list, perform four tasks:\n"
        "1. category: Classify into the SINGLE most accurate canonical category:\n"
        "   - 'ai': Artificial Intelligence, LLMs, machine learning, neural nets, AI hardware/chips, AI agents, OpenAI, Anthropic, etc.\n"
        "   - 'cybersecurity': Security breaches, zero-days, vulnerabilities, CVEs, malware, ransomware, CISA, phishing.\n"
        "   - 'cloud': Cloud providers (AWS, Azure, GCP), Kubernetes, cloud infrastructure, serverless, devops.\n"
        "   - 'quantum': Quantum computing, qubits, quantum error correction, quantum processors.\n"
        "   - 'commentary': Industry analysis, tech policy, antitrust, labor, opinion essays (Platformer, Pluralistic, etc.).\n"
        "   - 'emerging': Emerging tech, science, robotics, biotech, energy, semiconductors (not primarily AI).\n"
        "   - 'general': General consumer tech, gadgets, operating systems, personal computing.\n"
        "2. entities: Extract 2 to 4 concise named entities (companies, core technologies, CVEs, or products) for searchable tags (e.g. ['OpenAI', 'GPT-6', 'FTC']).\n"
        "3. cluster_id: If this article reports on the EXACT SAME real-world event/news item as another article in this list, assign them the exact same concise slug (e.g. 'crowdstrike-update-crash', 'nvidia-blackwell-shipping'). If standalone or unique, set cluster_id to null.\n"
        "4. key_takeaway: A single concise sentence (15 to 25 words) explaining why this technical story matters or its primary takeaway for tech writers.\n\n"
        "Return a strictly valid JSON array of objects with keys:\n"
        "id (number), category (string), entities (array of strings), cluster_id (string or null), key_takeaway (string).\n\n"
        f"Articles:\n{json.dumps(articles_payload, indent=2)}"
    )

    response = None
    last_error = None

    for model_name in MODELS_TO_TRY:
        for attempt in range(2):
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                if response and response.text:
                    break
            except Exception as ex:
                last_error = ex
                # Brief exponential backoff for transient 503 high demand or rate spikes
                await asyncio.sleep((attempt + 1) * 1.5)
                continue
        if response and response.text:
            break

    if not response or not response.text:
        raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")

    raw_text = response.text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    return json.loads(raw_text.strip())

async def run_curation_pipeline(limit: int = 100, batch_size: int = 15) -> Dict[str, Any]:
    """
    Curates recent uncurated articles in the background using Gemini.
    - Accurately classifies categories (ai, cybersecurity, cloud, quantum, etc.)
    - Extracts named entities for research tags
    - Clusters multi-outlet duplicate story coverage
    - Generates concise 1-sentence technical takeaways
    - Sets curated = 1
    Runs non-blockingly and safely.
    """
    global is_curating_now, curation_progress
    if not is_gemini_available():
        return {
            "status": "skipped",
            "message": "GEMINI_API_KEY not configured. Running with heuristic classification."
        }

    if _curation_lock.locked():
        return {"status": "in_progress", "message": "Curation is already running"}

    async with _curation_lock:
        is_curating_now = True
        try:
            from google import genai

            api_key = os.environ.get("GEMINI_API_KEY")
            client = genai.Client(api_key=api_key)

            conn = get_db_connection()
            cursor = conn.cursor()

            # Select uncurated articles ordered by publication date (newest first)
            cursor.execute("""
            SELECT id, title, publication, category, excerpt
            FROM articles
            WHERE (curated = 0 OR curated IS NULL) AND is_noise = 0
            ORDER BY published_at DESC
            LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()

            if not rows:
                conn.close()
                curation_progress = {"total": 0, "current": 0}
                return {"status": "up_to_date", "curated_count": 0}

            articles_to_process = [dict(r) for r in rows]
            total_updated = 0
            curation_progress = {"total": len(articles_to_process), "current": 0}

            # Process in small non-blocking batches
            for i in range(0, len(articles_to_process), batch_size):
                batch = articles_to_process[i:i + batch_size]
                try:
                    results = await curate_article_batch(client, batch)
                    for item in results:
                        article_id = item.get("id")
                        cat = item.get("category", "").lower().strip()
                        if cat not in CATEGORY_META:
                            cat = "general"
                        cat_label = CATEGORY_META[cat]["label"]
                        entities = json.dumps(item.get("entities", []))
                        cluster_id = item.get("cluster_id")
                        key_takeaway = item.get("key_takeaway")

                        if article_id:
                            cursor.execute("""
                            UPDATE articles
                            SET category = ?,
                                category_label = ?,
                                entities = ?,
                                cluster_id = COALESCE(?, cluster_id),
                                key_takeaway = ?,
                                curated = 1
                            WHERE id = ?
                            """, (cat, cat_label, entities, cluster_id, key_takeaway, article_id))
                            total_updated += 1

                    conn.commit()
                    curation_progress["current"] = total_updated
                except Exception as batch_err:
                    print(f"[Curator] Batch curation error: {batch_err}")

                # Yield control briefly to event loop between batches
                await asyncio.sleep(0.3)

            conn.close()
            print(f"[Curator] Background curation complete: {total_updated} articles curated.")
            return {
                "status": "success",
                "curated_count": total_updated
            }

        except Exception as e:
            print(f"[Curator] Pipeline error: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
        finally:
            is_curating_now = False
            curation_progress = {"total": 0, "current": 0}
