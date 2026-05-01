#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scrape KZ radio stations from radiolar.online and test streams."""

import re
import json
import time
import urllib.request
import urllib.error
import ssl
from urllib.parse import urljoin

BASE_URL = "https://radiolar.online/stations/facet/country/kz/"
OUT_FILE = r"C:\Users\Andrey\Desktop\All radio\tmp\kz-stations-working.json"
FAIL_FILE = r"C:\Users\Andrey\Desktop\All radio\tmp\kz-stations-failed.txt"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

def get_page(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception:
        return None

def test_stream(url, timeout=7):
    if not url or not url.startswith("http"):
        return False
    # Skip known redirectors that don't host real streams
    if re.search(r'zeno\.fm|myradio24\.com|t\.me|radio12345\.com|\.pls$|\.m3u$', url):
        return False
    try:
        req = urllib.request.Request(url, headers=HEADERS, method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            ct = r.headers.get("Content-Type", "")
            sc = r.status
            if 200 <= sc < 400:
                if re.search(r'audio|mpeg|ogg|aac|mpegurl|octet-stream', ct):
                    return True
                if re.search(r'\.mp3|\.m3u8|\.aac|\.ogg|/stream|/live|/radio|/listen', url, re.I):
                    return True
        return False
    except Exception:
        # Try GET for streams that reject HEAD
        try:
            req2 = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req2, timeout=timeout, context=CTX) as r2:
                ct2 = r2.headers.get("Content-Type", "")
                sc2 = r2.status
                if 200 <= sc2 < 400:
                    if re.search(r'audio|mpeg|ogg|aac|mpegurl|octet-stream', ct2):
                        return True
                    if re.search(r'\.mp3|\.m3u8|\.aac|\.ogg|/stream|/live|/radio|/listen', url, re.I):
                        return True
            return False
        except Exception:
            return False

def extract_stream(html):
    patterns = [
        r'"stream"\s*:\s*"(https?://[^"]+)"',
        r'"streamUrl"\s*:\s*"(https?://[^"]+)"',
        r'"contentUrl"\s*:\s*"(https?://[^"]+)"',
        r'data-stream=["\x27](https?://[^"\']+)["\x27]',
        r'"url"\s*:\s*"(https?://[^"]+\.(?:mp3|m3u8|aac|ogg)[^"]*)"',
        r'<audio[^>]+src=["\x27](https?://[^"\']+)["\x27]',
        r'streamURL\s*=\s*["\x27](https?://[^"\']+)["\x27]',
        r'["\x27](https?://[^"\']+\.m3u8[^"\']*)["\x27]',
        r'["\x27](https?://[^"\']+\.mp3[^"\']*)["\x27]',
        r'["\x27](https?://[^"\']+/stream\b[^"\']*)["\x27]',
        r'["\x27](https?://[^"\']+/live\b[^"\']*)["\x27]',
    ]
    for p in patterns:
        m = re.search(p, html, re.IGNORECASE)
        if m:
            u = m.group(1)
            if u.startswith("http"):
                return u
    return None

def extract_info(html):
    info = {
        "name": "",
        "genre": "Радио",
        "tags": ["Казахстан", "Прямой эфир"],
        "logoUrl": None,
        "stream": None,
    }
    # Name
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.I)
    if m:
        info["name"] = re.sub(r'\s+', ' ', m.group(1)).strip()
    else:
        m = re.search(r'<title>([^<|–]+)', html, re.I)
        if m:
            info["name"] = re.sub(r'\s+', ' ', m.group(1)).strip()

    # Logo
    m = re.search(r'"image"\s*:\s*"(https?://[^"]+)"', html)
    if m:
        info["logoUrl"] = m.group(1)

    # Genre guessing
    hl = html.lower()
    genre_map = [
        (r'поп|pop|хит|hit\b', 'Поп'),
        (r'\bрок\b|\brock\b', 'Рок'),
        (r'джаз|jazz', 'Джаз'),
        (r'электрон|electro|dance|танц|\bedm\b', 'Электронная'),
        (r'классик|classical', 'Классика'),
        (r'ретро|retro|oldies', 'Ретро'),
        (r'шансон|chanson', 'Шансон'),
        (r'новост|news|информ', 'Новости'),
        (r'детск|kids|children', 'Детское'),
        (r'folk|фолк|народ', 'Фолк'),
        (r'lounge|chill', 'Чилаут'),
    ]
    for pat, genre in genre_map:
        if re.search(pat, hl):
            info["genre"] = genre
            break

    info["stream"] = extract_stream(html)
    return info

# -- Main --
print("Fetching KZ stations list...")
list_html = get_page(BASE_URL)
if not list_html:
    print("ERROR: cannot fetch list page")
    exit(1)

# Extract all station page URLs
station_urls = list(dict.fromkeys(
    m.group(1)
    for m in re.finditer(r'href="(https://radiolar\.online/stations/[a-z0-9\-]+/)"', list_html)
    if "facet" not in m.group(1)
))
print(f"Found {len(station_urls)} stations")

working = []
failed = []

for i, url in enumerate(station_urls, 1):
    print(f"[{i}/{len(station_urls)}] {url}", end=" ... ", flush=True)
    html = get_page(url)
    if not html:
        print("SKIP (no page)")
        failed.append(f"{url} - no page")
        continue

    info = extract_info(html)

    if not info["stream"]:
        print(f"NO STREAM ({info['name']})")
        failed.append(f"{info['name']} {url} - no stream")
        continue

    ok = test_stream(info["stream"])
    if ok:
        print(f"OK  {info['name']}  =>  {info['stream']}")
        working.append(info)
    else:
        print(f"DEAD  {info['stream']}")
        failed.append(f"{info['name']} - dead: {info['stream']}")

    time.sleep(0.15)

# Save
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(working, f, ensure_ascii=False, indent=2)

with open(FAIL_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(failed))

print(f"\nDone: {len(working)} working, {len(failed)} failed/dead")
print(f"Saved to {OUT_FILE}")
