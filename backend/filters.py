import re
from typing import List, Tuple

# 1. Coupons, Deals, Promo Codes & Shopping Sales
COUPON_PATTERNS = [
    r'\b(coupon|promo codes?|discount codes?|coupons & deals)\b',
    r'\b\d+%\s*off\b',
    r'\bsave (up to )?\$\d+',
    r'\bscore a free trial\b',
    r'\b(deal alert|daily deals?|best deals?|top deals?)\b',
    r'\b(cheapest|best) .* (deals|sales)\b',
    r'\bon sale for \$\d+',
    r'\bblack friday deals?\b',
    r'\bprime day deals?\b'
]

# 2. Webinars, Workshops, Classes & Event Invitations
EVENT_PREFIXES = [
    '[virtual event]', 'virtual event:', '[webinar]', 'webinar:',
    '[workshop]', 'workshop:', 'masterclass:', 'free webinar:',
    '[live event]', 'live event:', '[summit]', 'virtual summit:',
    '[conference]'
]

EVENT_PATTERNS = [
    r'\b(webinar tomorrow|join our webinar|in this webinar|attend this webinar|watch this webinar)\b',
    r'\bregister (now|today|for (the|our)? (webinar|workshop|event|summit|masterclass|class|bootcamp))\b',
    r'\b(live workshop|free workshop|virtual workshop|upcoming workshop)\b',
    r'\b(free masterclass|live masterclass|online bootcamp|virtual masterclass)\b',
    r'\b(virtual summit 202\d|virtual event 202\d)\b',
    r'\b(call for papers|call for speakers|call for proposals|cfp:)\b',
    r'\b(sign up for the webinar|register for free)\b'
]

# 3. Sponsored & Advertorial Indicators
SPONSORED_PREFIXES = [
    '[sponsored]', 'sponsored:', '[promoted]', 'promoted:',
    'partner content:', '[partner content]', 'sponsored post:',
    'advertorial:', '[advertisement]'
]

# 4. Tags that indicate noise
NOISE_TAGS = {
    'coupons', 'deals', 'webinars', 'webinar', 'sponsored',
    'partner content', 'events', 'event', 'promotions', 'discounts'
}

_compiled_coupon_patterns = [re.compile(p, re.IGNORECASE) for p in COUPON_PATTERNS]
_compiled_event_patterns = [re.compile(p, re.IGNORECASE) for p in EVENT_PATTERNS]

def is_noise_or_event(title: str, excerpt: str = '', tags: List[str] = None) -> Tuple[bool, str]:
    """
    Analyzes title, excerpt, and tags to detect non-news items:
    - Events, webinars, summits, and conferences invitations
    - Workshops, masterclasses, and training sessions
    - Coupons, promo codes, deals, and sales
    - Sponsored and advertorial content
    
    Returns (True, reason) if it should be excluded, or (False, '') if clean news.
    """
    title_clean = title.strip()
    title_lower = title_clean.lower()

    # 1. Check title prefixes (e.g. "[Virtual Event] ...", "Webinar: ...")
    for prefix in EVENT_PREFIXES:
        if title_lower.startswith(prefix) or f' {prefix}' in title_lower:
            return True, f"event prefix '{prefix}'"

    for prefix in SPONSORED_PREFIXES:
        if title_lower.startswith(prefix) or f' {prefix}' in title_lower:
            return True, f"sponsored prefix '{prefix}'"

    # 2. Check coupon and deal regexes
    for pattern in _compiled_coupon_patterns:
        if pattern.search(title_lower):
            return True, f"commercial deal pattern: {pattern.pattern}"

    # 3. Check event & workshop regexes in title
    for pattern in _compiled_event_patterns:
        if pattern.search(title_lower):
            return True, f"event pattern: {pattern.pattern}"

    # 4. Check tags from feed
    if tags:
        for t in tags:
            if t.lower().strip() in NOISE_TAGS:
                return True, f"noise tag: {t}"

    # 5. Check excerpt for explicit registration calls
    if excerpt:
        excerpt_lower = excerpt[:300].lower()
        if re.search(r'\bregister now to attend\b', excerpt_lower) or \
           re.search(r'\bjoin us (live )?for this (free )?(webinar|workshop|event)\b', excerpt_lower):
            return True, "event registration call in excerpt"

    return False, ""
