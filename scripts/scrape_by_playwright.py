"""
Scrape BY (Belarus) radio stations from radiolar.online using Playwright.
Saves results to ../tmp/by-stations.json
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

BY_URLS = [
    "https://radiolar.online/stations/svoyoradio-by-svoe-radio-pinsk/",
    "https://radiolar.online/stations/minsknews-by-radio-minsk-92-4/",
    "https://radiolar.online/stations/radiokultura-by-kanal-kultura-belorusskoe-radio/",
    "https://radiolar.online/stations/novoeradio-by-novoe-radio-fresh/",
    "https://radiolar.online/stations/radio1-by-pershy-nacyyanalny-kanal-belaruskaga-rad/",
    "https://radiolar.online/stations/radiorelax-by-radye-relax/",
    "https://radiolar.online/stations/radiomaria-by-radye-maryya/",
    "https://radiolar.online/stations/alyaxen-fm-alyaxen-radiostation/",
    "https://radiolar.online/stations/aplus-fm-aplus-beat/",
    "https://radiolar.online/stations/aplus-fm-aplus-one-aac-16-kb-s/",
    "https://radiolar.online/stations/aplus-fm-aplus-progressive-techno/",
    "https://radiolar.online/stations/aplus-fm-deep-aplus-fm/",
    "https://radiolar.online/stations/aplus-fm-relax-aplus-fm/",
    "https://radiolar.online/stations/aplus-fm-rock-aplus-fm/",
    "https://radiolar.online/stations/jazzradionetwork-com-gjr/",
    "https://radiolar.online/stations/liderfm-by-lider-fm/",
    "https://radiolar.online/stations/loveisradio-by-love-is-radio/",
    "https://radiolar.online/stations/unistar-by-dvuhtysyachnye-radio-unistar/",
    "https://radiolar.online/stations/unistar-by-unistar-rap-hity/",
    "https://radiolar.online/stations/unistar-by-unistar-v-tempe/",
    "https://radiolar.online/stations/unistar-by-unistar-kavery/",
    "https://radiolar.online/stations/unistar-by-moy-rok-n-roll-unistar/",
    "https://radiolar.online/stations/unistar-by-ofisnoe-radio-unistar/",
    "https://radiolar.online/stations/unistar-by-svezhie-hity-yunistar/",
    "https://radiolar.online/stations/unistar-by-unistar/",
    "https://radiolar.online/stations/unistar-by-svezhie-hity-radio-unistar/",
    "https://radiolar.online/stations/bobrlife-by-zefir-fm/",
    "https://radiolar.online/stations/radioslovo-net-adkrytae-slova/",
    "https://radiolar.online/stations/radioslovo-net-otkrytoe-slovo/",
    "https://radiolar.online/stations/radioslovo-net-otkrytoe-slovo-avto-radio/",
    "https://radiolar.online/stations/radioslovo-net-otkrytoe-slovo-bratskie-vstrechi/",
    "https://radiolar.online/stations/radioslovo-net-otkrytoe-slovo-instrumentalnaya-muz/",
    "https://radiolar.online/stations/euroradio-fm-eraradye-alternative/",
    "https://radiolar.online/stations/euroradio-fm-eraradye-by/",
    "https://radiolar.online/stations/kompasfm-by-kompas-fm/",
    "https://radiolar.online/stations/mvolna-by-minskaya-volna-mv-radio/",
    "https://radiolar.online/stations/novoeradio-by-novoe-radio-98-4-fm/",
    "https://radiolar.online/stations/novoeradio-by-fresh-novoe-radio-belarus/",
    "https://radiolar.online/stations/novoeradio-by-megamix-novoe-radio/",
    "https://radiolar.online/stations/novoeradio-by-wake-up-show-novoe-radio-belarus/",
    "https://radiolar.online/stations/belros-tv-pervoe-soyuznoe-radioe/",
    "https://radiolar.online/stations/radio1-by-pervyy-nacionalnyy-kanal-belorusskogo-ra/",
    "https://radiolar.online/stations/radio123-by-radio-123/",
    "https://radiolar.online/stations/radiobelarus-by-radio-belarus-fm-radio-belarus-fm/",
    "https://radiolar.online/stations/radiobelarus-by-radio-belarus-radio-belarus/",
    "https://radiolar.online/stations/radiobrestfm-by-radio-brest-104-8-fm/",
    "https://radiolar.online/stations/radiobrestfm-by-radio-brest/",
    "https://radiolar.online/stations/radiominsk-by-radio-minsk/",
    "https://radiolar.online/stations/tvrmogilev-by-radio-mogilev/",
    "https://radiolar.online/stations/radiusfm-by-radius-fm/",
    "https://radiolar.online/stations/radiorelax-by-radio-relax-belarus/",
    "https://radiolar.online/stations/svaboda-org-radye-svaboda-naviny-belarusi/",
    "https://radiolar.online/stations/twr-fm-transmirovoe-radio-v-belarusi/",
    "https://radiolar.online/stations/alpha-by-alfa-radio-belarus/",
    "https://radiolar.online/stations/narodnoeradio-by-narodnoe/",
    "https://radiolar.online/stations/pilotfm-com-pilot-fm-belarus/",
    "https://radiolar.online/stations/radioradar-online-radar-lossless-radio/",
    "https://radiolar.online/stations/radioradar-online-radar-lossy/",
    "https://radiolar.online/stations/skif-by-radio-skif/",
    "https://radiolar.online/stations/wargaming-fm-wgfm-trance/",
    "https://radiolar.online/stations/wargaming-fm-wgfm-rock/",
    "https://radiolar.online/stations/wargaming-fm-wgfm-vtoroy-kanal/",
    "https://radiolar.online/stations/energyfm-by-energy-fm-belarus/",
    "https://radiolar.online/stations/radiovitebsk-by-radio-vitebsk/",
    "https://radiolar.online/stations/radioskuf-com-radio-skuf/",
    "https://radiolar.online/stations/centerfm-by-centr-fm/",
    "https://radiolar.online/stations/radiomir-by-radio-mir-v-belarusi/",
    "https://radiolar.online/stations/tvs-by-molodechno-fm/",
    "https://radiolar.online/stations/radiopobeda-by-radio-pobeda/",
    "https://radiolar.online/stations/pravdaradio-by-pravda-radio/",
    "https://radiolar.online/stations/radiokit-by-radio-kit-pop-dance/",
    "https://radiolar.online/stations/radiokit-by-radio-kit/",
    "https://radiolar.online/stations/radio-masterabelarusi-by-radio-mastera-belarusi/",
    "https://radiolar.online/stations/radiomix-dance-radiomix/",
    "https://radiolar.online/stations/rodnichok-bel-radio-rodnichok/",
    "https://radiolar.online/stations/roks-com-roks-fm/",
    "https://radiolar.online/stations/radiostalica-by-radio-stolica-belarus/",
    "https://radiolar.online/stations/tvoeradio-by-tvoe-radio/",
    "https://radiolar.online/stations/humorfm-by-yumor-fm-belarus/",
    "https://radiolar.online/stations/gomelradio-by-gomelskoe-gorodskoe-radio/",
    "https://radiolar.online/stations/radio-hiphop-by-hiphop-by/",
    "https://radiolar.online/stations/montecarlo-uno-monte-carlo-lounge/",
    "https://radiolar.online/stations/s13-live-s13-live/",
    "https://radiolar.online/stations/teploe-net-teploe-radio-netop-fm/",
    "https://radiolar.online/stations/legendy-by-legendy-fm-hits/",
    "https://radiolar.online/stations/legendy-by-legendy-fm-retro/",
    "https://radiolar.online/stations/air-racyja-com-radye-racyya/",
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
            const genreLinks = [...document.querySelectorAll('a[href*="/facet/tags/"]')];
            const genre = genreLinks.map(a => a.textContent.trim()).filter(t => t).join(', ');
            const logoImg = document.querySelector('.station_logo_wrap img, .station_logo img, [class*="logo"] img');
            const logoUrl = logoImg?.src || '';
            return { allText: allText.slice(0, 50000), h1, stationName, genre, logoUrl };
        }""")

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
    out_path = Path(__file__).parent.parent / "tmp" / "by-stations.json"
    out_path.parent.mkdir(exist_ok=True)

    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        total = len(BY_URLS)
        for i, url in enumerate(BY_URLS, 1):
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
