import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

CACHE_FILE = Path(__file__).parent.parent.parent / "cache" / "district_risk_cache.json"
CACHE_DURATION = 3 * 60 * 60  # 3 hours in seconds

def ensure_cache_dir():
    """Ensure cache directory exists"""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

def get_cached_risk(district_name: str) -> Optional[dict]:
    """Get cached risk data for a district if still valid"""
    ensure_cache_dir()

    if not CACHE_FILE.exists():
        return None

    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)

        district_data = cache.get(district_name)
        if not district_data:
            return None

        # Check if cache is still valid (within 3 hours)
        cached_time = district_data.get("cached_at", 0)
        if time.time() - cached_time < CACHE_DURATION:
            return district_data.get("data")

        return None

    except Exception as e:
        print(f"[cache] Error reading cache: {e}")
        return None

def set_cached_risk(district_name: str, risk_data: dict):
    """Cache risk data for a district"""
    ensure_cache_dir()

    try:
        # Load existing cache
        cache = {}
        if CACHE_FILE.exists():
            with open(CACHE_FILE, "r") as f:
                cache = json.load(f)

        # Update cache for this district
        cache[district_name] = {
            "cached_at": time.time(),
            "cached_at_readable": datetime.now().isoformat(),
            "data": risk_data
        }

        # Write back to file
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)

    except Exception as e:
        print(f"[cache] Error writing cache: {e}")

def get_all_cached_districts() -> dict:
    """Get all cached districts with their risk scores"""
    ensure_cache_dir()

    if not CACHE_FILE.exists():
        return {}

    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)

        result = {}
        current_time = time.time()

        for district_name, district_data in cache.items():
            cached_time = district_data.get("cached_at", 0)
            # Only return valid (non-expired) cache entries
            if current_time - cached_time < CACHE_DURATION:
                result[district_name] = district_data.get("data")

        return result

    except Exception as e:
        print(f"[cache] Error reading all cache: {e}")
        return {}

def clear_expired_cache():
    """Remove expired entries from cache"""
    ensure_cache_dir()

    if not CACHE_FILE.exists():
        return

    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)

        current_time = time.time()
        updated_cache = {}

        for district_name, district_data in cache.items():
            cached_time = district_data.get("cached_at", 0)
            if current_time - cached_time < CACHE_DURATION:
                updated_cache[district_name] = district_data

        with open(CACHE_FILE, "w") as f:
            json.dump(updated_cache, f, indent=2)

        removed = len(cache) - len(updated_cache)
        if removed > 0:
            print(f"[cache] Cleared {removed} expired entries")

    except Exception as e:
        print(f"[cache] Error clearing expired cache: {e}")

def get_cache_stats() -> dict:
    """Get statistics about the cache"""
    ensure_cache_dir()

    if not CACHE_FILE.exists():
        return {"total": 0, "valid": 0, "expired": 0}

    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)

        current_time = time.time()
        valid = 0
        expired = 0

        for district_data in cache.values():
            cached_time = district_data.get("cached_at", 0)
            if current_time - cached_time < CACHE_DURATION:
                valid += 1
            else:
                expired += 1

        return {
            "total": len(cache),
            "valid": valid,
            "expired": expired,
            "cache_duration_hours": CACHE_DURATION / 3600
        }

    except Exception as e:
        print(f"[cache] Error getting cache stats: {e}")
        return {"total": 0, "valid": 0, "expired": 0}
