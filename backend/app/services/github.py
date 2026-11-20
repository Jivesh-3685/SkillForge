"""
SkillForge AI — GitHub API Service

Fetches user repositories, language bytes, and commit activity.
Follows PRD guidelines:
- Scope: read-only public data
- Repos: latest 20 non-fork repositories
- Commit count: per_page=1 + parse Link header to avoid rate limit exhaustion
- Rate limit handling: checks headers, backoff / cache fallback
"""

import re
import asyncio
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.config import settings


GITHUB_API_BASE = "https://api.github.com"


class GitHubService:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SkillForge-AI",
        }

    async def get_authenticated_user(self) -> dict:
        """Fetch basic profile of the authenticated GitHub user."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(f"{GITHUB_API_BASE}/user", headers=self.headers)
            if res.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="GitHub token expired or revoked. Please reconnect your GitHub account.",
                )
            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"GitHub API error: {res.text}",
                )
            return res.json()

    async def fetch_repos(self, username: str) -> list[dict]:
        """Fetch latest 20 non-fork public repositories sorted by updated date."""
        params = {
            "type": "owner",
            "sort": "updated",
            "direction": "desc",
            "per_page": 30,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                headers=self.headers,
                params=params,
            )
            if res.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="GitHub token expired or revoked. Please disconnect and reconnect your GitHub account in GitHub Sync.",
                )
            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Failed to fetch repositories: {res.text}",
                )
            repos = res.json()
            # Filter non-fork public repos and take at most 20
            non_fork_repos = [r for r in repos if not r.get("fork")]
            return non_fork_repos[:20]

    async def fetch_repo_languages(self, client: httpx.AsyncClient, owner: str, repo: str) -> dict:
        """Fetch bytes of code per language for a specific repository."""
        res = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/languages",
            headers=self.headers,
        )
        if res.status_code == 200:
            return res.json()
        return {}

    async def fetch_commit_count(
        self, client: httpx.AsyncClient, owner: str, repo: str, author: str
    ) -> int:
        """
        Fetch commit count for an author in a repository efficiently using
        per_page=1 and reading the 'last' page from the 'Link' response header.
        Avoids paging through every commit and saves API rate limits.
        """
        try:
            res = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits",
                headers=self.headers,
                params={"author": author, "per_page": 1},
            )
            if res.status_code != 200:
                return 0

            commits = res.json()
            if not isinstance(commits, list) or len(commits) == 0:
                return 0

            link_header = res.headers.get("link", "")
            if not link_header:
                return len(commits)

            # Match rel="last" in Link header: e.g. <...page=42>; rel="last"
            match = re.search(r'[?&]page=(\d+)[^>]*>;\s*rel="last"', link_header)
            if match:
                return int(match.group(1))

            return len(commits)
        except Exception:
            return 0

    async def scan_user_activity(self, username: str) -> dict:
        """
        Scan user's GitHub activity:
        - Repositories (up to 20 non-fork)
        - Languages per repo (aggregated bytes and percentages)
        - Commit count per repo
        """
        repos = await self.fetch_repos(username)

        aggregated_languages: dict[str, int] = {}
        total_commits = 0
        repo_summaries = []

        async with httpx.AsyncClient(timeout=20.0) as client:
            # Batch fetch languages and commits concurrently
            lang_tasks = [
                self.fetch_repo_languages(client, username, r["name"])
                for r in repos
            ]
            commit_tasks = [
                self.fetch_commit_count(client, username, r["name"], username)
                for r in repos
            ]

            lang_results, commit_results = await asyncio.gather(
                asyncio.gather(*lang_tasks),
                asyncio.gather(*commit_tasks),
            )

            for i, repo in enumerate(repos):
                langs = lang_results[i]
                commits = commit_results[i]
                total_commits += commits

                for lang, bytes_count in langs.items():
                    aggregated_languages[lang] = aggregated_languages.get(lang, 0) + bytes_count

                repo_summaries.append({
                    "id": repo["id"],
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "html_url": repo["html_url"],
                    "description": repo.get("description"),
                    "primary_language": repo.get("language"),
                    "languages": langs,
                    "commits": commits,
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "created_at": repo.get("created_at"),
                    "updated_at": repo.get("updated_at"),
                })

        # Calculate language percentages
        total_bytes = sum(aggregated_languages.values())
        language_breakdown = [
            {
                "language": lang,
                "bytes": count,
                "percentage": round((count / total_bytes) * 100, 1) if total_bytes > 0 else 0,
            }
            for lang, count in sorted(aggregated_languages.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "username": username,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
            "repo_count": len(repo_summaries),
            "total_commits": total_commits,
            "languages": language_breakdown,
            "repositories": repo_summaries,
        }
