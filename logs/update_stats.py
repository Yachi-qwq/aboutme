#!/usr/bin/env python3
"""Fetch aggregate GoatCounter totals and write privacy-minimized JSON."""

from __future__ import annotations

import base64
import json
import os
import re
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


LOG_FILE = Path(__file__).with_name("site-stats.json")
API_TIMEOUT_SECONDS = 20
START_DATE = "2000-01-01T00:00:00Z"


def aggregate_daily_stats(rows: list[dict[str, object]], generated_at: str) -> dict[str, object]:
    daily_views: dict[str, int] = {}

    for row in rows:
        day = row.get("day")
        count = row.get("daily", 0)
        if not isinstance(day, str):
            raise ValueError("GoatCounter returned a statistic without a date.")
        datetime.strptime(day, "%Y-%m-%d")
        if isinstance(count, bool) or not isinstance(count, int) or count < 0:
            raise ValueError(f"GoatCounter returned an invalid count for {day}.")
        if count == 0:
            continue
        daily_views[day] = daily_views.get(day, 0) + count

    monthly_views: dict[str, int] = defaultdict(int)
    yearly_views: dict[str, int] = defaultdict(int)
    for day, count in daily_views.items():
        monthly_views[day[:7]] += count
        yearly_views[day[:4]] += count

    return {
        "status": "ready",
        "source": "GoatCounter",
        "timezone": "UTC",
        "generated_at": generated_at,
        "total_views": sum(daily_views.values()),
        "daily_views": dict(sorted(daily_views.items())),
        "monthly_views": dict(sorted(monthly_views.items())),
        "yearly_views": dict(sorted(yearly_views.items())),
    }


def fetch_stats(site_code: str, api_token: str) -> dict[str, object]:
    if not re.fullmatch(r"[a-zA-Z0-9-]{1,63}", site_code):
        raise ValueError("GOATCOUNTER_CODE must be a GoatCounter site code.")
    if not api_token.strip():
        raise ValueError("GOATCOUNTER_API_TOKEN is required.")

    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    query = urlencode({
        "start": START_DATE,
        "end": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    url = (
        f"https://{site_code.lower()}.goatcounter.com/api/v0/stats/total?"
        f"{query}"
    )
    basic_credentials = base64.b64encode(f":{api_token}".encode("utf-8")).decode("ascii")
    request = Request(
        url,
        headers={
            "Authorization": f"Basic {basic_credentials}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=API_TIMEOUT_SECONDS) as response:
            payload = json.load(response)
    except HTTPError as error:
        raise RuntimeError(
            f"GoatCounter API returned HTTP {error.code}; check the site code "
            "and that the API token has statistics read access."
        ) from error
    except URLError as error:
        raise RuntimeError(f"Could not reach the GoatCounter API: {error.reason}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError("GoatCounter returned invalid JSON.") from error

    rows = payload.get("stats") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        raise RuntimeError("GoatCounter response is missing its daily statistics.")
    if not all(isinstance(row, dict) for row in rows):
        raise RuntimeError("GoatCounter returned malformed daily statistics.")

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return aggregate_daily_stats(rows, generated_at)


def write_stats(stats: dict[str, object]) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_name = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=LOG_FILE.parent,
            prefix=".site-stats-",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_name = temporary_file.name
            json.dump(stats, temporary_file, indent=2, ensure_ascii=True)
            temporary_file.write("\n")
        os.replace(temporary_name, LOG_FILE)
    finally:
        if temporary_name and os.path.exists(temporary_name):
            os.unlink(temporary_name)


def main() -> None:
    site_code = os.environ.get("GOATCOUNTER_CODE", "").strip()
    api_token = os.environ.get("GOATCOUNTER_API_TOKEN", "")
    stats = fetch_stats(site_code, api_token)
    write_stats(stats)
    print(
        f"Wrote aggregate GoatCounter statistics for "
        f"{len(stats['daily_views'])} days to {LOG_FILE}."
    )


if __name__ == "__main__":
    main()
