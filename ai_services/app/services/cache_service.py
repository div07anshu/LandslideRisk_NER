import json
import os
import tempfile
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

CACHE_FILE = Path(__file__).parent.parent.parent / "cache" / "district_risk_cache.json"
CACHE_DURATION = 3 * 60 * 60  # 3 hours in seconds

# FastAPI runs sync endpoints in a thread pool, so concurrent requests can
# read-modify-write this file at the same time. Serialize all access and
# write atomically (temp file + rename) so a write can never be interleaved
# with another read/write and leave the JSON file truncated/corrupted.
_cache_lock = threading.Lock()


def _read_cache_unlocked() -> dict:
    if not CACHE_FILE.exists():
        return {}
    with open(CACHE_FILE, "r") as f:
        content = f.read().strip()
    return json.loads(content) if content else {}


def _write_cache_unlocked(cache: dict):
    fd, tmp_path = tempfile.mkstemp(dir=CACHE_FILE.parent, prefix=".tmp-", suffix=".json")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(cache, f, indent=2)
        os.replace(tmp_path, CACHE_FILE)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise

def ensure_cache_dir():
    """Ensure cache directory exists"""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

def get_cached_risk(district_name: str) -> Optional[dict]:
    """Get cached risk data for a district if still valid"""
    ensure_cache_dir()

    with _cache_lock:
        try:
            cache = _read_cache_unlocked()
        except Exception as e:
            print(f"[cache] Error reading cache: {e}")
            return None

    district_data = cache.get(district_name)
    if not district_data:
        return None

    # Check if cache is still valid (within 3 hours)
    cached_time = district_data.get("cached_at", 0)
    if time.time() - cached_time < CACHE_DURATION:
        return district_data.get("data")

    return None

def set_cached_risk(district_name: str, risk_data: dict):
    """Cache risk data for a district"""
    ensure_cache_dir()

    with _cache_lock:
        try:
            cache = _read_cache_unlocked()
        except Exception as e:
            print(f"[cache] Error reading cache before write, resetting: {e}")
            cache = {}

        cache[district_name] = {
            "cached_at": time.time(),
            "cached_at_readable": datetime.now().isoformat(),
            "data": risk_data
        }

        try:
            _write_cache_unlocked(cache)
        except Exception as e:
            print(f"[cache] Error writing cache: {e}")

def get_all_cached_districts() -> dict:
    """Get all cached districts with their risk scores"""
    ensure_cache_dir()

    with _cache_lock:
        try:
            cache = _read_cache_unlocked()
        except Exception as e:
            print(f"[cache] Error reading all cache: {e}")
            return {}

    result = {}
    current_time = time.time()

    for district_name, district_data in cache.items():
        cached_time = district_data.get("cached_at", 0)
        # Only return valid (non-expired) cache entries
        if current_time - cached_time < CACHE_DURATION:
            result[district_name] = district_data.get("data")

    return result

def clear_expired_cache():
    """Remove expired entries from cache"""
    ensure_cache_dir()

    with _cache_lock:
        try:
            cache = _read_cache_unlocked()
        except Exception as e:
            print(f"[cache] Error clearing expired cache: {e}")
            return

        current_time = time.time()
        updated_cache = {}

        for district_name, district_data in cache.items():
            cached_time = district_data.get("cached_at", 0)
            if current_time - cached_time < CACHE_DURATION:
                updated_cache[district_name] = district_data

        try:
            _write_cache_unlocked(updated_cache)
        except Exception as e:
            print(f"[cache] Error clearing expired cache: {e}")
            return

        removed = len(cache) - len(updated_cache)
        if removed > 0:
            print(f"[cache] Cleared {removed} expired entries")

def get_cache_stats() -> dict:
    """Get statistics about the cache"""
    ensure_cache_dir()

    with _cache_lock:
        try:
            cache = _read_cache_unlocked()
        except Exception as e:
            print(f"[cache] Error getting cache stats: {e}")
            return {"total": 0, "valid": 0, "expired": 0}

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
