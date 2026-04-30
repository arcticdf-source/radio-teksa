from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_URL = "https://radiopotok.ru"
PAYLOAD_RE = re.compile(r"const RP_RADIO = \{\d+:(\{.*?\}),\};", re.S)


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", "ignore")


def load_station(station_url: str) -> tuple[dict[str, object] | None, str | None]:
    station_id = station_url.rsplit("/", 1)[-1]

    try:
      script_text = fetch_text(f"{BASE_URL}/f/script6.1/{station_id}.js")
    except urllib.error.HTTPError as exc:
      return None, f"{station_url} :: HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001
      return None, f"{station_url} :: {exc}"

    match = PAYLOAD_RE.search(script_text)
    if not match:
      return None, f"{station_url} :: payload missing"

    try:
      payload = json.loads(match.group(1))
      streams = json.loads(payload.get("stream") or "[]")
    except Exception as exc:  # noqa: BLE001
      return None, f"{station_url} :: parse error {exc}"

    primary_stream = next((item.get("file") for item in streams if item.get("file")), None)
    if not primary_stream:
      return None, f"{station_url} :: stream missing"

    name = " ".join((payload.get("name") or f"Radio {station_id}").split())
    return {
      "id": f"rp-{station_id}",
      "externalId": int(station_id),
      "name": name,
      "stream": primary_stream,
      "sourceUrl": station_url,
      "logoUrl": f"{BASE_URL}/f/station_webp/256/{station_id}.webp",
      "description": "Станция из каталога RadioPotok.",
      "listeners": "Источник: RadioPotok",
      "tags": ["Radiopotok", "Live"],
    }, None


def iter_station_urls() -> list[str]:
    sitemap = fetch_text(f"{BASE_URL}/sitemap.xml")
    return sorted(
        set(re.findall(r"https://radiopotok\.ru/radio/\d+", sitemap)),
        key=lambda value: int(value.rsplit("/", 1)[-1]),
    )


def run_batch(start: int, end: int, outdir: Path, workers: int) -> tuple[int, int]:
    urls = iter_station_urls()[start:end]
    stations: list[dict[str, object]] = []
    failed: list[str] = []

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(load_station, url) for url in urls]
        for future in as_completed(futures):
            station, error = future.result()
            if station is not None:
                stations.append(station)
            elif error:
                failed.append(error)

    stations.sort(key=lambda item: item["externalId"])
    outdir.mkdir(parents=True, exist_ok=True)

    batch_file = outdir / f"stations-{start:03d}-{end:03d}.json"
    batch_file.write_text(json.dumps(stations, ensure_ascii=False, indent=2), encoding="utf-8")

    failed_file = outdir / f"stations-{start:03d}-{end:03d}.failed.txt"
    failed_file.write_text("\n".join(failed) + ("\n" if failed else ""), encoding="utf-8")
    return len(stations), len(failed)


def combine_batches(outdir: Path, output_path: Path) -> tuple[int, int]:
    station_map: dict[int, dict[str, object]] = {}
    failed_lines: set[str] = set()

    for batch_file in sorted(outdir.glob("stations-*.json")):
        for station in json.loads(batch_file.read_text(encoding="utf-8")):
            station_map[int(station["externalId"])] = station

    for failed_file in sorted(outdir.glob("stations-*.failed.txt")):
        failed_lines.update(line for line in failed_file.read_text(encoding="utf-8").splitlines() if line.strip())

    stations = [station_map[key] for key in sorted(station_map)]
    stations.sort(key=lambda item: item["externalId"])
    output_path.write_text(
        "window.STATIONS = " + json.dumps(stations, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    return len(stations), len(failed_lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["batch", "combine"])
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end", type=int, default=100)
    parser.add_argument("--outdir", default="tmp")
    parser.add_argument("--output", default="stations-data.js")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    workspace = Path(__file__).resolve().parent.parent
    outdir = workspace / args.outdir
    output_path = workspace / args.output

    if args.mode == "batch":
        ok_count, failed_count = run_batch(args.start, args.end, outdir, args.workers)
        print(f"BATCH_OK={ok_count}")
        print(f"BATCH_FAILED={failed_count}")
        return 0

    total_count, failed_count = combine_batches(outdir, output_path)
    print(f"TOTAL_OK={total_count}")
    print(f"TOTAL_FAILED={failed_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())