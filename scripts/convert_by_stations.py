import json
from pathlib import Path

BASE = Path(__file__).parent.parent

with open(BASE / "tmp" / "by-stations.json", encoding="utf-8") as f:
    raw = json.load(f)

stations_with_streams = [
    station for station in raw
    if station.get("streams") and station.get("name") and "Ой! Страницы" not in station.get("name", "")
]

seen_streams = set()
unique = []
for station in stations_with_streams:
    stream = station["streams"][0].strip()
    key = stream.lower().rstrip("/")
    if key in seen_streams:
        continue
    seen_streams.add(key)
    unique.append(station)

GENRE_MAP = {
    "популярная": "Поп",
    "поп": "Поп",
    "хиты": "Поп",
    "танцевальная": "Танцевальная",
    "электронная": "Электронная",
    "техно": "Техно",
    "хаус": "Хаус",
    "рок": "Рок",
    "альтернативная": "Рок",
    "классическая": "Классика",
    "новости": "Новости",
    "разговорное": "Разговорное",
    "релакс": "Лаунж",
    "джаз": "Джаз",
    "блюз": "Блюз",
    "хип хоп": "Хип-хоп",
    "хип-хоп": "Хип-хоп",
    "народная": "Фолк",
    "религиозная": "Религиозное",
    "разное": "Разное",
    "юмор": "Юмор",
}

COLOR_SETS = [
    ["#0F766E", "#115E59"],
    ["#1D4ED8", "#1E40AF"],
    ["#BE185D", "#9D174D"],
    ["#7C3AED", "#5B21B6"],
    ["#B45309", "#92400E"],
    ["#047857", "#065F46"],
    ["#C2410C", "#9A3412"],
    ["#334155", "#1E293B"],
]


def infer_genre(name: str, genre_str: str) -> str:
    haystack = f"{name} {genre_str}".lower()

    if "марыя" in haystack or "maria" in haystack or "слово" in haystack:
        return "Религиозное"
    if "gjr" in haystack or "jazz" in haystack:
        return "Джаз"
    if "rap" in haystack or "hiphop" in haystack:
        return "Хип-хоп"
    if "relax" in haystack or "lounge" in haystack:
        return "Лаунж"
    if "rock" in haystack or "рок" in haystack or "roks" in haystack:
        return "Рок"
    if "trance" in haystack:
        return "Транс"
    if "юмор" in haystack or "humor" in haystack:
        return "Юмор"
    if "новин" in haystack or "свабода" in haystack or "belarus fm" in haystack or "radio belarus" in haystack:
        return "Новости"
    if "instrumental" in haystack or "инструмент" in haystack:
        return "Классика"
    if "правда" in haystack or "мир" in haystack or "город" in haystack or "fm/" in haystack:
        return "Разговорное"
    if "народное" in haystack or "родничок" in haystack:
        return "Фолк"
    if "radar" in haystack or "kit" in haystack or "megamix" in haystack or "wake up" in haystack or "центр fm" in haystack:
        return "Танцевальная"
    if "теплое" in haystack or "тёплое" in haystack or "legendy" in haystack or "легенды" in haystack:
        return "Ретро"

    for key, value in GENRE_MAP.items():
        if key in haystack:
            return value

    if "retro" in haystack:
        return "Ретро"
    if "dance" in haystack or "megamix" in haystack:
        return "Танцевальная"
    if "hits" in haystack or "fresh" in haystack or "unistar" in haystack:
        return "Поп"
    return "Разное"


def make_id(idx: int, name: str) -> str:
    slug = name.lower().replace(" ", "-")
    slug = "".join(ch for ch in slug if ch.isalnum() or ch == "-")[:24]
    return f"by-{idx:03d}-{slug}"


js_lines = []
for index, station in enumerate(unique, 1):
    name = station["name"].strip()
    stream = station["streams"][0].strip()
    logo = station.get("logo", "").strip() or None
    genre = infer_genre(name, station.get("genre", ""))
    color = COLOR_SETS[(index - 1) % len(COLOR_SETS)]
    station_id = make_id(index, name)
    escaped_name = name.replace('\\', '\\\\').replace('"', '\\"')
    logo_value = f'"{logo}"' if logo else "null"

    js_lines.append(f'''  {{
    id: "{station_id}",
    name: "{escaped_name}",
    stream: "{stream}",
    genre: "{genre}",
    description: "Прямой эфир онлайн.",
    listeners: "Прямой эфир",
    city: "Беларусь",
    tags: ["Беларусь", "Прямой эфир"],
    logoUrl: {logo_value},
    badge: "BY",
    color: ["{color[0]}", "{color[1]}"]
  }}''')

output = ",\n".join(js_lines)
(BASE / "tmp" / "by-stations-js.txt").write_text(output, encoding="utf-8")
print(f"Total with streams: {len(stations_with_streams)}, unique streams: {len(unique)}")
print(f"Ready to append {len(unique)} stations to stations-data.js")
