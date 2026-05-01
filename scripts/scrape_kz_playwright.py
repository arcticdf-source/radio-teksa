"""
Scrape KZ radio stations from radiolar.online using Playwright.
Extracts stream URLs from loaded JS after page render.
Saves results to ../tmp/kz-stations.json
"""
import asyncio
import json
import re
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Installing playwright...", flush=True)
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
    from playwright.async_api import async_playwright

KZ_URLS = [
    "https://radiolar.online/stations/avtoradio-kz-avtoradio/",
    "https://radiolar.online/stations/vashe-kz-vashe-radio/",
    "https://radiolar.online/stations/zhanafm-kz-zhaa-lounge/",
    "https://radiolar.online/stations/zhanafm-kz-zhaa-mix/",
    "https://radiolar.online/stations/zhanafm-kz-zhaa-rock/",
    "https://radiolar.online/stations/narodnoeradio-kz-narodnoe-radio/",
    "https://radiolar.online/stations/qazradio-fm-radio-classic/",
    "https://radiolar.online/stations/radiokn-kz-radio-kn/",
    "https://radiolar.online/stations/ns-kz-radio-ns-nacionalnaya-set/",
    "https://radiolar.online/stations/energyfm-kz-energy-fm/",
    "https://radiolar.online/stations/alau-kz-alau/",
    "https://radiolar.online/stations/rassvet-info-radio-rassvet/",
    "https://radiolar.online/stations/orda-fm-radio-orda/",
    "https://radiolar.online/stations/qazradio-fm-radio-astana/",
    "https://radiolar.online/stations/massaget-kz-zhuldyz-fm/",
    "https://radiolar.online/stations/dachafm-kz-radio-dacha/",
    "https://radiolar.online/stations/luxfm-kz-radio-lux-fm/",
    "https://radiolar.online/stations/radiotmk-kz-tatarskoe-radio-tmk/",
    "https://radiolar.online/stations/cityradio-kz-radio-city-almaty/",
    "https://radiolar.online/stations/radiotandem-kz-radio-tandem/",
    "https://radiolar.online/stations/zhanafm-kz-zhaa-fm/",
    "https://radiolar.online/stations/businessfm-kz-business-fm/",
    "https://radiolar.online/stations/aloharadio-online-aloha-fm/",
    "https://radiolar.online/stations/radio-greendance-su-green-dance/",
    "https://radiolar.online/stations/aisyn-kz-aysyn-fm/",
    "https://radiolar.online/stations/radio-profi-centr-kz-radio-onlayn-zhitikara/",
    "https://radiolar.online/stations/toiduman-kz-toy-duman/",
    "https://radiolar.online/stations/beufm-kz-beu-fm/",
    "https://radiolar.online/stations/rusradio-kz-russkoe-radio-aziya/",
    "https://radiolar.online/stations/tengrifm-kz-tengri-fm/",
    "https://radiolar.online/stations/qazradio-fm-shalar-radiosy/",
    "https://radiolar.online/stations/qazradio-fm-aza-radiosy/",
    "https://radiolar.online/stations/veseloeradio-kz-yumor-fm-kazahstan/",
    "https://radiolar.online/stations/europaplus-kz-evropa-plyus-kazahstan/",
    "https://radiolar.online/stations/loveradio-kz-love-radio/",
    "https://radiolar.online/stations/jjfm-kz-jibek-joly-101-4fm/",
    "https://radiolar.online/stations/loveradio-kz-love-radio-kazakhstan/",
    "https://radiolar.online/stations/ns-kz-radio-ns/",
    "https://radiolar.online/stations/orda-fm-orda-fm/",
    "https://radiolar.online/stations/zhanafm-kz-pioner-fm-kz/",
    "https://radiolar.online/stations/qazradio-fm-kazahskoe-radio/",
    "https://radiolar.online/stations/cityradio-kz-radio-city/",
    "https://radiolar.online/stations/radiotmk-kz-radio-tmk/",
    "https://radiolar.online/stations/zhuldyzfm-kz-zhulduz-radio/",
    "https://radiolar.online/stations/zhanafm-kz-novoe-radio-zhana-fm/",
    "https://radiolar.online/stations/sanacorp-kz-radio-sana/",
    "https://radiolar.online/stations/hordelo-kz-radio-rauan/",
    "https://radiolar.online/stations/talap-com-radio-talap/",
    "https://radiolar.online/stations/radio7-kz-radio-7-kazahstan/",
    "https://radiolar.online/stations/rikatv-kz-aktobe-radio/",
    "https://radiolar.online/stations/boomroom-kz-boomroom-kz/",
    "https://radiolar.online/stations/businessfm-kz-business-fm-kazahstan/",
    "https://radiolar.online/stations/energyfm-kz-energy-fm-kazahstan/",
    "https://radiolar.online/stations/luxfm-kz-lux-fm-kazahstan/",
    "https://radiolar.online/stations/alau-kz-radio-alau/",
    "https://radiolar.online/stations/ns-kz-radio-ns-kz/",
    "https://radiolar.online/stations/sanacorp-kz-radio-rauan/",
    "https://radiolar.online/stations/toiduman-kz-radio-toy-duman/",
    "https://radiolar.online/stations/pavlodarnews-kz-radio-halyk/",
    "https://radiolar.online/stations/starkids-fm-radio-starkids-fm/",
    "https://radiolar.online/stations/zhuldyzfm-kz-zhuldyz-fm/",
    "https://radiolar.online/stations/myradio24-com-russkoe-radio-kostanay/",
    "https://radiolar.online/stations/myradio24-com-like-fm-kazahstan/",
    "https://radiolar.online/stations/myradio24-com-radio-azamat/",
    "https://radiolar.online/stations/myradio24-com-apex-fm-dushevnoe-radio/",
    "https://radiolar.online/stations/myradio24-com-ostrovok/",
]

STREAM_RE = re.compile(
    r'"(https?://[^"]+(?::8\d{3}|:9\d{3}|/stream|/listen|\.mp3|\.m3u8|\.aac|icecast|shoutcast)[^"]*)"'
)
IGNORE_DOMAINS = re.compile(r'radiolar\.online|google|cloudflare|yandex|facebook|googleapis|gstatic')


async def scrape_station(page, url: str) -> dict:
    result = {"url": url, "streams": [], "name": "", "genre": "", "logo": ""}
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)

        data = await page.evaluate("""() => {
            const allText = [...document.querySelectorAll('script:not([src])')].map(s => s.textContent || '').join('\\n');
            const h1 = document.querySelector('h1')?.textContent?.trim() || '';
            const stationName = document.querySelector('strong')?.textContent?.trim() || '';
            
            // Genre link
            const genreLinks = [...document.querySelectorAll('a[href*="/facet/tags/"]')];
            const genre = genreLinks.map(a => a.textContent.trim()).filter(t => t).join(', ');
            
            // Logo image
            const logoImg = document.querySelector('.station_logo_wrap img, .station_logo img, [class*="logo"] img');
            const logoUrl = logoImg?.src || '';
            
            return { allText: allText.slice(0, 50000), h1, stationName, genre, logoUrl };
        }""")

        # Extract name: from H1 or strong
        raw_name = data.get("stationName") or data.get("h1") or ""
        name = re.sub(r'\s*[–—-].*$', '', raw_name).strip()
        name = re.sub(r'Радио\s*▶.*', '', name).strip()

        result["name"] = name
        result["genre"] = data.get("genre", "")
        result["logo"] = data.get("logoUrl", "")

        all_text = data.get("allText", "")
        matches = STREAM_RE.findall(all_text)
        streams = [u for u in matches if not IGNORE_DOMAINS.search(u)]
        seen = set()
        for s in streams:
            if s not in seen:
                seen.add(s)
                result["streams"].append(s)

    except Exception as e:
        result["error"] = str(e)

    return result


async def main():
    out_path = Path(__file__).parent.parent / "tmp" / "kz-stations.json"
    out_path.parent.mkdir(exist_ok=True)

    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        total = len(KZ_URLS)
        for i, url in enumerate(KZ_URLS, 1):
            print(f"[{i}/{total}] {url}", flush=True)
            res = await scrape_station(page, url)
            results.append(res)
            stream_preview = res["streams"][0] if res["streams"] else "NO STREAM"
            print(f"   -> {res.get('name', '?')!r:35s} | {stream_preview}", flush=True)

        await browser.close()

    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved {len(results)} stations to {out_path}", flush=True)

    with_streams = [r for r in results if r.get("streams")]
    without_streams = [r for r in results if not r.get("streams")]
    print(f"With streams: {len(with_streams)} / Without: {len(without_streams)}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
