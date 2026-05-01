"""Fast scrape of Uzbekistan stations from radiolar.online using data-streams attribute"""
import urllib.request, re, json, time

BASE = "https://radiolar.online"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

import ssl
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=10, context=CTX).read().decode("utf-8", errors="ignore")

def scrape_station(url):
    html = fetch(url)
    stream_match = re.search(r'data-streams="([^"]+)"', html)
    if not stream_match:
        return None
    streams_raw = stream_match.group(1)
    # Clean up the stream URL (take the base URL without query params as it changes)
    stream = streams_raw.split("?")[0]

    name_match = re.search(r'<title>([^<]+)</title>', html)
    name = ""
    if name_match:
        name = name_match.group(1)
        name = re.sub(r'\s*[–-]\s*слушать.*', '', name).strip()
        name = re.sub(r'\s*онлайн.*', '', name, flags=re.IGNORECASE).strip()

    # favicon/logo from og:image
    logo_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    logo = logo_match.group(1) if logo_match else ""

    # tags/genre
    tags_match = re.findall(r'/stations/facet/tags/[^/]+/">([^<]+)<', html)
    tags = tags_match if tags_match else []

    # country
    country_match = re.search(r'/stations/facet/country/uz/">\s*([^<]+)<', html)
    country = country_match.group(1).strip() if country_match else "Uzbekistan"

    return {"name": name, "stream": stream, "logoUrl": logo, "tags": tags,
            "country": "Узбекистан", "countryCode": "UZ", "sourceUrl": url}

# Step 1: Get list page
print("Fetching station list...")
html_list = fetch(f"{BASE}/stations/facet/country/uz/")

# Extract station links
all_links = re.findall(r'href="(/stations/[^"]+)"', html_list)
station_slugs = list(dict.fromkeys([
    l for l in all_links
    if "/facet/" not in l and l != "/stations/"
]))
print(f"Found {len(station_slugs)} stations")

stations = []
for slug in station_slugs:
    url = BASE + slug
    name_hint = slug.split("/stations/")[-1].strip("/")
    print(f"  {name_hint[:40]}...", end=" ", flush=True)
    try:
        result = scrape_station(url)
        if result and result["stream"].startswith("http") and "://" in result["stream"] and not result["stream"].endswith("/"):
            print(f"OK  => {result['stream'][:60]}")
            stations.append(result)
            # Save partial results after each station
            with open("tmp/uz-stations-raw.json", "w", encoding="utf-8") as f:
                json.dump(stations, f, ensure_ascii=False, indent=2)
        else:
            print("NO STREAM")
    except Exception as e:
        print(f"ERR: {e}")
    time.sleep(0.3)

print(f"\nTotal: {len(stations)} stations with streams")
out_path = "tmp/uz-stations-raw.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(stations, f, ensure_ascii=False, indent=2)
print(f"Saved to {out_path}")
