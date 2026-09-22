import re
from typing import List, Tuple, Dict, Any

# Canonical category metadata
CATEGORY_META: Dict[str, Dict[str, str]] = {
    "ai": {"label": "AI"},
    "cybersecurity": {"label": "Cybersecurity"},
    "cloud": {"label": "Cloud"},
    "quantum": {"label": "Quantum Computing"},
    "emerging": {"label": "New & Emerging Tech"},
    "commentary": {"label": "Tech Commentary"},
    "general": {"label": "General Tech"},
}

# 1. AI Keywords & Patterns
# High confidence: title matches or strong multi-word terms
AI_STRONG_TERMS = [
    r'\b(artificial intelligence|generative ai|genai|machine learning|deep learning)\b',
    r'\b(chatgpt|openai|anthropic|claude|deepseek|mistral ai|cohere|perplexity ai)\b',
    r'\b(large language models?|llms?|foundation models?|multimodal models?)\b',
    r'\b(gpt-[345o]|gemini 1\.[05]|gemini 2\.[05]|gemini 3\.[0-9]|claude 3\.[057]|llama [234])\b',
    r'\b(ai agents?|autonomous agents?|diffusion models?|midjourney|sora|stablediffusion)\b',
    r'\b(neural networks?|transformer models?|reinforcement learning|rlhf|ai safety|superalignment)\b',
    r'\b(nvidia.*(blackwell|h100|b200|gb200|ai chip)|groq lpu|tpu v[56])\b',
]

# Medium confidence (requires title match or presence in tags/multiple mentions)
AI_MEDIUM_TERMS = [
    r'\b(ai)\b',
    r'\b(copilot|perplexity|robotics|humanoid robots?)\b',
]

# 2. Cybersecurity Keywords & Patterns
CYBER_STRONG_TERMS = [
    r'\b(cybersecurity|cyber attacks?|cyber espionage|ransomware|infostealer|malware)\b',
    r'\b(zero-day|0-day|cve-\d{4}-\d+|vulnerabilit(y|ies)|critical vulnerability)\b',
    r'\b(phishing attack|spear-phishing|ddos attack|botnet|trojan|spyware|keylogger)\b',
    r'\b(data breach|security breach|credential stuffing|sql injection|remote code execution|rce)\b',
    r'\b(cisa|threat actor|apt\d+|nation-state hackers?|dark web|evilproxy|eviltokens)\b',
]

CYBER_MEDIUM_TERMS = [
    r'\b(hackers?|hacked|exploit|exploited|security patch|bug bounty)\b',
]

# 3. Cloud & Infrastructure Keywords & Patterns
CLOUD_STRONG_TERMS = [
    r'\b(amazon web services|aws|google cloud platform|gcp|microsoft azure)\b',
    r'\b(kubernetes|k8s|serverless|docker containers?|containerization|cloud-native)\b',
    r'\b(infrastructure as code|terraform|ansible|microservices architecture)\b',
    r'\b(cloudflare|fastly|content delivery network|cloud security|multi-cloud)\b',
]

CLOUD_MEDIUM_TERMS = [
    r'\b(cloud computing|cloud storage|s3 buckets?|ec2|lambda functions?|devops)\b',
]

# 4. Quantum Computing Keywords & Patterns
QUANTUM_STRONG_TERMS = [
    r'\b(quantum comput(ing|er|ers)|qubits?|superconducting qubits?|trapped-ion|ion trap)\b',
    r'\b(quantum supremacy|quantum error correction|quantum cryptography|post-quantum)\b',
    r'\b(quantum algorithms?|quantum entanglement|quantum annealing|photonic quantum)\b',
]

# Compile regex patterns for fast evaluation
_compiled_ai_strong = [re.compile(p, re.IGNORECASE) for p in AI_STRONG_TERMS]
_compiled_ai_medium = [re.compile(p, re.IGNORECASE) for p in AI_MEDIUM_TERMS]

_compiled_cyber_strong = [re.compile(p, re.IGNORECASE) for p in CYBER_STRONG_TERMS]
_compiled_cyber_medium = [re.compile(p, re.IGNORECASE) for p in CYBER_MEDIUM_TERMS]

_compiled_cloud_strong = [re.compile(p, re.IGNORECASE) for p in CLOUD_STRONG_TERMS]
_compiled_cloud_medium = [re.compile(p, re.IGNORECASE) for p in CLOUD_MEDIUM_TERMS]

_compiled_quantum_strong = [re.compile(p, re.IGNORECASE) for p in QUANTUM_STRONG_TERMS]

# Dedicated specialty feeds where the feed topic should be preserved unless strong evidence exists
DEDICATED_FEEDS = {
    "ai": {"mit-ai", "venturebeat-ai", "import-ai", "marktechpost"},
    "cybersecurity": {"bleeping-computer", "the-hackers-news", "krebs-security", "dark-reading"},
    "cloud": {"aws-blog", "cloudflare-blog", "google-cloud-blog", "infoq-cloud"},
    "quantum": {"quantum-computing-report", "physics-world-quantum", "the-quantum-insider"},
    "commentary": {"platformer", "rest-of-world", "pluralistic", "pragmatic-engineer"}
}

def classify_article(
    title: str,
    excerpt: str = "",
    tags: List[str] = None,
    feed_id: str = "",
    default_category: str = "general",
    default_label: str = "General Tech"
) -> Tuple[str, str]:
    """
    Classifies an article into one of the canonical categories:
    - 'ai'
    - 'cybersecurity'
    - 'cloud'
    - 'quantum'
    - 'commentary'
    - 'emerging'
    - 'general'

    Returns (category_slug, category_label).
    """
    title_clean = title.strip()
    excerpt_clean = (excerpt or "").strip()
    tags_list = tags or []
    tags_str = " ".join(tags_list).lower()
    combined_text = f"{title_clean} {excerpt_clean[:400]} {tags_str}"

    # Check if feed has a dedicated specialty
    dedicated_category = None
    for cat_name, feed_ids in DEDICATED_FEEDS.items():
        if feed_id in feed_ids:
            dedicated_category = cat_name
            break

    # Score categories
    scores = {
        "ai": 0,
        "cybersecurity": 0,
        "cloud": 0,
        "quantum": 0
    }

    # 1. AI evaluation
    for p in _compiled_ai_strong:
        if p.search(title_clean):
            scores["ai"] += 12  # Strong title match
        elif p.search(combined_text):
            scores["ai"] += 5

    for p in _compiled_ai_medium:
        if p.search(title_clean):
            scores["ai"] += 8
            break
        elif p.search(excerpt_clean[:300]):
            scores["ai"] += 3

    if any(t.lower() == "ai" or "artificial intelligence" in t.lower() for t in tags_list):
        scores["ai"] += 4

    # 2. Cybersecurity evaluation
    for p in _compiled_cyber_strong:
        if p.search(title_clean):
            scores["cybersecurity"] += 12
        elif p.search(combined_text):
            scores["cybersecurity"] += 5

    for p in _compiled_cyber_medium:
        if p.search(title_clean):
            scores["cybersecurity"] += 7
            break
        elif p.search(combined_text):
            scores["cybersecurity"] += 3

    if any("security" in t.lower() or "malware" in t.lower() for t in tags_list):
        scores["cybersecurity"] += 4

    # 3. Cloud evaluation
    for p in _compiled_cloud_strong:
        if p.search(title_clean):
            scores["cloud"] += 12
        elif p.search(combined_text):
            scores["cloud"] += 5

    for p in _compiled_cloud_medium:
        if p.search(title_clean):
            scores["cloud"] += 7
            break
        elif p.search(combined_text):
            scores["cloud"] += 3

    if any("cloud" in t.lower() or "aws" in t.lower() or "kubernetes" in t.lower() for t in tags_list):
        scores["cloud"] += 4

    # 4. Quantum evaluation
    for p in _compiled_quantum_strong:
        if p.search(title_clean):
            scores["quantum"] += 15
        elif p.search(combined_text):
            scores["quantum"] += 7

    # Find highest scoring technical category
    best_cat, best_score = max(scores.items(), key=lambda x: x[1])

    # Threshold: If strong signal found (score >= 6)
    if best_score >= 6:
        label = CATEGORY_META[best_cat]["label"]
        return best_cat, label

    # If no strong technical domain was triggered, check dedicated feed
    if dedicated_category:
        label = CATEGORY_META.get(dedicated_category, {}).get("label", default_label)
        return dedicated_category, label

    # Respect default feed category if it's commentary or emerging
    if default_category in ("commentary", "emerging"):
        label = CATEGORY_META.get(default_category, {}).get("label", default_label)
        return default_category, label

    # Fallback to general tech
    return "general", CATEGORY_META["general"]["label"]
