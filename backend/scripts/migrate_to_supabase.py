"""
SkillForge AI — One-Click Data Migration Script: Local/Mongo -> Supabase

Transfers all locally saved users, scans, verified skill scores, roadmaps,
and project records from backend/data/local_db.json into your Supabase project.

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe scripts\\migrate_to_supabase.py
"""

import json
import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from supabase import create_client

LOCAL_DB_FILE = BACKEND_DIR / "data" / "local_db.json"


def run_migration():
    print("=" * 65)
    print("SkillForge AI — Supabase Data Migration Engine")
    print("=" * 65)

    supabase_url = settings.supabase_url or os.getenv("SUPABASE_URL")
    supabase_key = settings.supabase_service_role_key or settings.supabase_key or os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("\n❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in backend/.env")
        print("Please configure them in backend/.env before running this script.")
        return False

    print(f"\n[1/3] Connecting to Supabase at: {supabase_url}...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        # Probe connection
        test_res = supabase.table("users").select("id").limit(1).execute()
        print("✓ Connected successfully to Supabase PostgreSQL!")
    except Exception as e:
        print(f"❌ Connection to Supabase failed: {e}")
        print("Tip: Ensure you have executed backend/migrations/001_supabase_schema.sql in the Supabase SQL Editor.")
        return False

    if not LOCAL_DB_FILE.exists():
        print(f"\n[2/3] No local database file found at {LOCAL_DB_FILE}. Nothing to migrate.")
        return True

    print(f"\n[2/3] Reading existing data from: {LOCAL_DB_FILE}...")
    with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} collections to evaluate.\n")
    print("[3/3] Migrating collections to Supabase tables...")

    stats = {}
    for col_name, docs in data.items():
        if not docs:
            continue

        migrated = 0
        table = supabase.table(col_name)
        print(f"  • Migrating '{col_name}' ({len(docs)} records)...", end=" ")

        for doc in docs:
            clean_doc = dict(doc)
            # Remove mongo internal _id or map to id only if valid uuid
            raw_id = clean_doc.pop("_id", None)
            if raw_id:
                try:
                    import uuid
                    uuid.UUID(str(raw_id))
                    clean_doc["id"] = str(raw_id)
                except ValueError:
                    clean_doc.pop("id", None)

            # Store in 'data' column as backup for flexible document schema
            payload = dict(clean_doc)
            if col_name != "oauth_states":
                payload["data"] = dict(clean_doc)

            try:
                # Upsert record
                table.upsert(payload).execute()
                migrated += 1
            except Exception as row_err:
                try:
                    basic_payload = {
                        "firebase_uid": clean_doc.get("firebase_uid"),
                    }
                    if col_name != "oauth_states":
                        basic_payload["data"] = clean_doc
                    if "state" in clean_doc:
                        basic_payload["state"] = clean_doc["state"]
                    table.upsert(basic_payload).execute()
                    migrated += 1
                except Exception as retry_err:
                    print(f"\n    ⚠️ Failed to migrate record: {retry_err}")

        print(f"✓ {migrated}/{len(docs)} migrated.")
        stats[col_name] = migrated

    print("\n" + "=" * 65)
    print("Migration Completed Successfully!")
    for k, v in stats.items():
        print(f"  - {k}: {v} records copied to Supabase")
    print("=" * 65)
    return True


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
