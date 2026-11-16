"""
SkillForge AI — Link Health Checker

Validates that every URL in resources.json returns HTTP 200 or valid redirect.
Prevents dead links and ensures 100% working free resources.
"""

import asyncio
import json
import httpx
from pathlib import Path

RESOURCES_FILE = Path(__file__).resolve().parent.parent / "app" / "resources.json"


async def check_url(client: httpx.AsyncClient, resource: dict) -> tuple[str, str, int, bool]:
    url = resource["url"]
    title = resource["title"]
    try:
        # Send HEAD request first, fallback to GET with streaming
        res = await client.head(url, follow_redirects=True, timeout=10.0)
        if res.status_code in (405, 403):
            res = await client.get(url, follow_redirects=True, timeout=10.0)
        is_ok = res.status_code < 400
        return (resource["id"], title, res.status_code, is_ok)
    except Exception:
        return (resource["id"], title, 0, False)


async def main():
    with open(RESOURCES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    resources = data.get("resources", [])
    print(f"Checking {len(resources)} curated learning resources...")

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SkillForge-LinkChecker/1.0"}
    async with httpx.AsyncClient(headers=headers, verify=False) as client:
        tasks = [check_url(client, r) for r in resources]
        results = await asyncio.gather(*tasks)

    passed = 0
    failed = 0
    for r_id, title, status, ok in results:
        status_symbol = "✓" if ok else "✗"
        print(f"[{status_symbol}] {r_id}: {title[:40]:<40} (Status: {status})")
        if ok:
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 50)
    print(f"Link Check Summary: {passed} passed, {failed} failed.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
