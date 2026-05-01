"""
Convert scraped KZ stations JSON to JavaScript format and append to stations-data.js
"""
import json
from pathlib import Path

BASE = Path(__file__).parent.parent

# Load scraped data
with open(BASE / "tmp" / "kz-stations.json", encoding="utf-8") as f:
    raw = json.load(f)

# Only stations WITH streams
stations_with_streams = [s for s in raw if s.get("streams")]

# Deduplicate by stream URL (keep first occurrence)
seen_streams = set()
unique = []
for s in stations_with_streams:
    key = s["streams"][0].lower().strip("/")
    if key not in seen_streams:
        seen_streams.add(key)
        unique.append(s)

print(f"Total with streams: {len(stations_with_streams)}, unique streams: {len(unique)}")

# Genre mapping (Russian radiolar → consistent genre names)
GENRE_MAP = {
    "популярная": "Поп",
    "поп": "Поп",
    "хиты": "Поп",
    "танцевальная": "Электронная",
    "электронная": "Электронная",
    "рок": "Рок",
    "классическая": "Классика",
    "классика": "Классика",
    "новости": "Разговорное",
    "разговорное": "Разговорное",
    "релакс": "Лаунж",
    "джаз": "Джаз",
    "детская": "Детское",
    "разное": "Разное",
    "казахская": "Казахская",
    "национальная": "Казахская",
    "фольклор": "Казахская",
}

COLOR_SETS = [
    ["#6B46C1", "#4C51BF"],
    ["#D53F8C", "#B83280"],
    ["#2B6CB0", "#2C5282"],
    ["#276749", "#22543D"],
    ["#744210", "#975A16"],
    ["#1A365D", "#2A4365"],
    ["#702459", "#521B41"],
    ["#234E52", "#1D4044"],
    ["#3C366B", "#2D3748"],
    ["#1A202C", "#2D3748"],
]

def pick_genre(genre_str):
    if not genre_str:
        return "Разное"
    parts = [p.strip().lower() for p in genre_str.split(",")]
    for p in parts:
        for key, val in GENRE_MAP.items():
            if key in p:
                return val
    return "Разное"

def make_id(idx, name):
    slug = name.lower().replace(" ", "-")
    slug = "".join(c for c in slug if c.isalnum() or c == "-")[:20]
    return f"kz-{idx:03d}-{slug}"

js_lines = []

for i, s in enumerate(unique, 1):
    name = s["name"].strip()
    stream = s["streams"][0]
    genre = pick_genre(s.get("genre", ""))
    color = COLOR_SETS[i % len(COLOR_SETS)]
    station_id = make_id(i, name)

    # Escape quotes in name
    name_escaped = name.replace('"', '\\"').replace("'", "\\'")

    js = f"""  {{
    id: "{station_id}",
    name: "{name_escaped}",
    stream: "{stream}",
    genre: "{genre}",
    description: "Прямой эфир онлайн.",
    listeners: "Прямой эфир",
    city: "Казахстан",
    tags: ["Казахстан", "Прямой эфир"],
    logoUrl: null,
    badge: "KZ",
    color: ["{color[0]}", "{color[1]}"]
  }}"""
    js_lines.append(js)

print(f"\nReady to add {len(js_lines)} KZ stations")

# Show what we have
for s in unique:
    print(f"  {s['name']!r:40s} -> {s['streams'][0]}")

# Write output file to inspect
output = ",\n".join(js_lines)
(BASE / "tmp" / "kz-stations-js.txt").write_text(output, encoding="utf-8")
print(f"\nOutput written to tmp/kz-stations-js.txt")
print(f"Ready to append {len(unique)} stations to stations-data.js")
