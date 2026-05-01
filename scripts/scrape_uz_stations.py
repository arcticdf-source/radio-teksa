"""Scrape Uzbekistan radio stations from radiolar.online"""
import json, re, time
from playwright.sync_api import sync_playwright

BASE = "https://radiolar.online"
LIST_URL = f"{BASE}/stations/facet/country/uz/"

def scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Get list of station URLs
        print("Fetching station list...")
        page.goto(LIST_URL, wait_until="networkidle", timeout=30000)
        links = page.eval_on_selector_all(
            "a[href*='/stations/']",
            "els => els.map(e => e.href)"
        )
        station_links = list(dict.fromkeys([
            l for l in links
            if "/stations/facet/" not in l
            and l != f"{BASE}/stations/"
            and l.startswith(f"{BASE}/stations/")
        ]))
        print(f"Found {len(station_links)} station links")

        stations = []
        for url in station_links:
            try:
                slug = url.rstrip("/").split("/stations/")[-1]
                print(f"  {slug}...", end=" ", flush=True)

                # Intercept network requests to catch stream URLs
                stream_url = {"val": None}
                audio_urls = []

                def on_request(req):
                    u = req.url
                    if any(ext in u for ext in [".mp3", ".aac", ".ogg", ".m3u8", ".m3u", "/stream", "/live", ":8000", ":8080", ":9000", ":9443"]):
                        if "radiolar" not in u and "googleapis" not in u:
                            audio_urls.append(u)

                page.on("request", on_request)
                page.goto(url, wait_until="networkidle", timeout=25000)

                # Try to find stream URL in page scripts/data
                html = page.content()
                patterns = [
                    r'"stream_url"\s*:\s*"([^"]+)"',
                    r'"stream"\s*:\s*"(https?://[^"]+)"',
                    r'"url"\s*:\s*"(https?://[^"]+(?:\.mp3|\.aac|\.ogg|\.m3u8|/stream|/live)[^"]*)"',
                    r'source\s+src=["\']([^"\']+(?:\.mp3|\.aac|\.ogg|\.m3u8)[^"\']*)["\']',
                    r'data-stream=["\']([^"\']+)["\']',
                    r'"streamUrl"\s*:\s*"([^"]+)"',
                    r"'streamUrl'\s*:\s*'([^']+)'",
                    r'stream:\s*["\']([^"\']+)["\']',
                ]
                for pat in patterns:
                    m = re.search(pat, html, re.IGNORECASE)
                    if m:
                        stream_url["val"] = m.group(1)
                        break

                # Try clicking play button and capture audio request
                if not stream_url["val"]:
                    try:
                        play_btn = page.query_selector("button.play, button[class*='play'], .play-btn, [data-action='play'], button[aria-label*='play' i]")
                        if play_btn:
                            play_btn.click()
                            time.sleep(2)
                    except:
                        pass
                    if audio_urls:
                        stream_url["val"] = audio_urls[0]

                # Check JS variables in page
                if not stream_url["val"]:
                    try:
                        val = page.evaluate("""() => {
                            const s = window.stationStream || window.streamUrl || window.station_stream;
                            if (s) return s;
                            const a = document.querySelector('audio');
                            if (a && a.src) return a.src;
                            const s2 = document.querySelector('source');
                            if (s2 && s2.src) return s2.src;
                            return null;
                        }""")
                        if val and val.startswith("http"):
                            stream_url["val"] = val
                    except:
                        pass

                if not stream_url["val"] and audio_urls:
                    stream_url["val"] = audio_urls[0]

                # Get station name
                name = page.title().replace(" – слушать в прямом эфире", "").strip()

                # Get logo
                logo = ""
                try:
                    logo_el = page.query_selector("img.station-logo, img[alt*='FM'], img[class*='logo']")
                    if logo_el:
                        logo = logo_el.get_attribute("src") or ""
                except:
                    pass

                page.remove_listener("request", on_request)

                if stream_url["val"]:
                    print(f"OK => {stream_url['val'][:60]}")
                    stations.append({
                        "name": name,
                        "stream": stream_url["val"],
                        "logoUrl": logo,
                        "sourceUrl": url,
                        "country": "Uzbekistan",
                        "countryCode": "UZ"
                    })
                else:
                    print(f"NO STREAM")

            except Exception as e:
                print(f"ERROR: {e}")
                try:
                    page.remove_listener("request", on_request)
                except:
                    pass

        browser.close()
        return stations

if __name__ == "__main__":
    stations = scrape()
    print(f"\nCollected {len(stations)} stations with streams")
    with open("tmp/uz-stations-raw.json", "w", encoding="utf-8") as f:
        json.dump(stations, f, ensure_ascii=False, indent=2)
    print("Saved to tmp/uz-stations-raw.json")
