"""
Скрейпер Яндекс Радио.

Алгоритм:
1. Загружает главную страницу radio.yandex.ru (1+ МБ Next.js бандл).
2. Извлекает из JS-кода все объекты станций (id, title, coverUri).
3. Для каждой станции загружает её страницу и находит stream URL
   через мета-тег og:audio или через embedded JSON.
4. Выдаёт yandex-stations.js с window.YANDEX_STATIONS массивом.

Запуск:
    py scripts/scrape_yandex_radio.py
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
BASE = "https://radio.yandex.ru"
OUT_FILE = Path(__file__).parent.parent / "yandex-stations.js"
EXISTING_IDS_FILE = Path(__file__).parent.parent / "stations-data.js"

# Известные stream URLs (hostingradio.ru) — добавляем вручную,
# так как stream нельзя извлечь без авторизации
KNOWN_STREAMS: dict[str, str] = {
    "avtoradio":      "https://avtoradio.hostingradio.ru/avtoradio128.mp3",
    "business-fm":    "https://businessfm.hostingradio.ru:8027/businessfm128.mp3",
    "chanson":        "https://chanson.hostingradio.ru:8041/chanson128.mp3",
    "dorognoe-radio": "https://dorognoe.hostingradio.ru/dorognoe128.mp3",
    "energy":         "https://energy.hostingradio.ru/energy128.mp3",
    "europa-plus":    "https://europaplus.hostingradio.ru/europaplus128.mp3",
    "hit-fm":         "https://hitfm.hostingradio.ru:8027/hitfm128.mp3",
    "jazz":           "https://jazz.hostingradio.ru:8027/jazz128.mp3",
    "keks":           "https://keks.hostingradio.ru:8027/keks128.mp3",
    "komsomolskaya":  "https://komsomolskaya.hostingradio.ru/komsomolskaya128.mp3",
    "love-radio":     "https://love.hostingradio.ru:8027/love128.mp3",
    "marusy":         "https://marusya.hostingradio.ru/marusya128.mp3",
    "marusy-a":       "https://marusya.hostingradio.ru/marusya128.mp3",
    "maximum":        "https://maximum.hostingradio.ru/maximum128.mp3",
    "monte-carlo":    "https://montecarlo.hostingradio.ru:8027/montecarlo128.mp3",
    "nashe":          "https://nashe.hostingradio.ru/nashe128.mp3",
    "radio-dacha":    "https://dcha.hostingradio.ru:8027/dcha128.mp3",
    "radio-pi-fm":    "https://pifm.hostingradio.ru/pifm128.mp3",
    "radio-top-radio":"https://topradio.hostingradio.ru/topradio128.mp3",
    "radio7":         "https://radio7.hostingradio.ru:8040/radio7128.mp3",
    "radio-c":        "https://radioc.hostingradio.ru/radioc128.mp3",
    "rbk":            "https://rbc.hostingradio.ru/rbc128.mp3",
    "record":         "https://radiorecord.hostingradio.ru/rr_128/stream",
    "relax-fm":       "https://relax.hostingradio.ru/relax128.mp3",
    "retro-fm":       "https://retro.hostingradio.ru:8041/retro128.mp3",
    "rusradio":       "https://rusradio.hostingradio.ru/rusradio128.mp3",
    "radiovanya":     "https://vanya.hostingradio.ru:8027/vanya128.mp3",
    "vesti-fm":       "https://vestifm.hostingradio.ru/vestifm128.mp3",
    "mayak":          "https://mayak.hostingradio.ru/mayak128.mp3",
    "radio-rossii":   "https://radiorossii.hostingradio.ru/radiorossii128.mp3",
    "radio1":         "https://radio1.hostingradio.ru/radio1128.mp3",
    "radio-kultura":  "https://kultura.hostingradio.ru/kultura128.mp3",
    "dfm":            "https://dfm.hostingradio.ru:8000/dfm128.mp3",
    "comedy-radio":   "https://comedyradio.hostingradio.ru/comedyradio128.mp3",
    "humor-fm":       "https://humor.hostingradio.ru/humor128.mp3",
    "punky-bruster":  "https://punkybruster.hostingradio.ru/punkybruster128.mp3",
    "logo-color":     "",  # пропускаем — это не станция
    "undefined":      "",  # пропускаем
}

GENRE_MAP: dict[str, str] = {
    "avtoradio":      "Поп",
    "business-fm":    "Новости",
    "chanson":        "Шансон",
    "dorognoe-radio": "Поп",
    "energy":         "Поп",
    "europa-plus":    "Поп",
    "hit-fm":         "Поп",
    "jazz":           "Джаз",
    "keks":           "Поп",
    "komsomolskaya":  "Поп",
    "love-radio":     "Поп",
    "marusy":         "Поп",
    "maximum":        "Рок",
    "monte-carlo":    "Джаз",
    "nashe":          "Рок",
    "radio-dacha":    "Поп",
    "radio-pi-fm":    "Поп",
    "radio-top-radio":"Поп",
    "radio7":         "Поп",
    "radio-c":        "Поп",
    "rbk":            "Новости",
    "record":         "Электронная",
    "relax-fm":       "Чилаут",
    "retro-fm":       "Ретро",
    "rusradio":       "Поп",
    "radiovanya":     "Поп",
    "vesti-fm":       "Новости",
    "mayak":          "Новости",
    "radio-rossii":   "Новости",
    "radio1":         "Поп",
    "radio-kultura":  "Классика",
    "dfm":            "Электронная",
    "comedy-radio":   "Юмор",
    "humor-fm":       "Юмор",
    "europa-plus":    "Поп",
}

DESC_MAP: dict[str, str] = {
    "avtoradio":      "Музыка в дорогу.",
    "business-fm":    "Первое деловое радио.",
    "chanson":        "Песни о жизни, сердце и пути.",
    "dorognoe-radio": "Музыка для тех, кто за рулём.",
    "energy":         "Лучшие мировые хиты.",
    "europa-plus":    "Вся музыка мира.",
    "hit-fm":         "Главные и актуальные хиты.",
    "jazz":           "Мир джаза.",
    "keks":           "Больше позитива!",
    "komsomolskaya":  "Радио Комсомольская правда.",
    "love-radio":     "Музыка, что говорит «люблю».",
    "marusy":         "Радио для всей семьи.",
    "maximum":        "Если радио — то MAXIMUM.",
    "monte-carlo":    "Ваш безупречный вкус.",
    "nashe":          "Русский рок всегда.",
    "radio-dacha":    "Уют, ностальгия и радость.",
    "radio-pi-fm":    "Мир! Лайф! Драйв!",
    "radio-top-radio":"Лучшие треки эфира.",
    "radio7":         "Хиты семи десятилетий.",
    "radio-c":        "Хиты и душа Екатеринбурга.",
    "rbk":            "Деловое радио.",
    "record":         "Танцевальная музыка.",
    "relax-fm":       "Музыка для релакса.",
    "retro-fm":       "Лучшие хиты 70-х, 80-х, 90-х.",
    "rusradio":       "Русский хит-парад.",
    "radiovanya":     "Хиты для всех.",
    "vesti-fm":       "Вести. Первое новостное радио.",
    "mayak":          "Радио Маяк — всегда рядом.",
    "radio-rossii":   "Главное государственное радио.",
    "radio1":         "Радио 1.",
    "radio-kultura":  "Радио культуры.",
    "dfm":            "Танцуй под DFM.",
    "comedy-radio":   "Смех без остановки.",
    "humor-fm":       "Юмор FM — смешное радио.",
}

TAG_MAP: dict[str, list[str]] = {
    "chanson":        ["Шансон", "Лирика"],
    "jazz":           ["Джаз", "Классика"],
    "relax-fm":       ["Чилаут", "Релакс"],
    "retro-fm":       ["Ретро", "Хиты"],
    "record":         ["Электронная", "Танцевальная"],
    "nashe":          ["Рок", "Русский рок"],
    "maximum":        ["Рок", "Хиты"],
    "monte-carlo":    ["Джаз", "Поп"],
    "business-fm":    ["Новости", "Деловое"],
    "rbk":            ["Новости", "Деловое"],
    "vesti-fm":       ["Новости"],
    "mayak":          ["Новости"],
    "radio-rossii":   ["Новости"],
    "radio-kultura":  ["Классика"],
    "dfm":            ["Электронная", "Танцевальная"],
    "comedy-radio":   ["Юмор"],
    "humor-fm":       ["Юмор"],
    "love-radio":     ["Поп", "Романтика"],
    "radio-dacha":    ["Поп", "Народная"],
    "europa-plus":    ["Поп", "Хиты"],
    "energy":         ["Поп", "Хиты"],
    "hit-fm":         ["Поп", "Хиты"],
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", "ignore")


def extract_stations_from_html(html: str) -> list[dict]:
    """Извлекаем ID станций и их логотипы из HTML главной страницы."""
    stations: dict[str, dict] = {}

    # 1. Ищем блоки вида: station/SLUG — формат Next.js href
    slug_re = re.compile(r'/station/([a-z][a-z0-9\-]{1,40})')
    for slug in slug_re.findall(html):
        if slug not in stations:
            stations[slug] = {"id": slug, "title": "", "coverUri": ""}

    # 2. Ищем avatars.mds.yandex.net URLs с /radio_XXX- или /img. pattern
    cover_re = re.compile(
        r'(avatars\.mds\.yandex\.net/get-music-misc/\d+/'
        r'(?:radio_[a-z0-9_\-]+|img\.[a-f0-9]+)[^/\s"\'\\<>]{0,50})'
    )
    for cover in cover_re.findall(html):
        # Пытаемся сопоставить с известным slug по имени файла
        name_part = re.search(r'radio_([a-z0-9_]+)', cover)
        if name_part:
            slug_candidate = name_part.group(1).replace("_", "-")
            for slug in stations:
                if slug_candidate == slug or slug_candidate.startswith(slug.replace("-", "_")):
                    if not stations[slug]["coverUri"]:
                        stations[slug]["coverUri"] = "https://" + cover
                    break

    # 3. Вытаскиваем title из <title> тегов или og:title на страницах
    # (делается отдельно при обходе страниц станций)

    print(f"Найдено slug'ов: {len(stations)}")
    return list(stations.values())


def enrich_station(slug: str) -> dict | None:
    """Загружает страницу станции и собирает title + coverUri."""
    try:
        html = fetch(f"{BASE}/station/{slug}")
    except Exception as e:
        print(f"  SKIP {slug}: {e}")
        return None

    # og:title
    title_m = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', html)
    title = title_m.group(1).strip() if title_m else slug

    # og:image
    image_m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
    cover = image_m.group(1).strip() if image_m else ""

    # Альтернатива: avatars в любом месте
    if not cover:
        av = re.search(r'https://avatars\.mds\.yandex\.net/get-music-misc/[^\s"\'<>]+', html)
        if av:
            cover = av.group(0)

    return {"id": slug, "title": title, "coverUri": cover}


def load_existing_yx_ids() -> set[str]:
    """Читает yandex-stations.js и возвращает уже добавленные IDs."""
    if not OUT_FILE.exists():
        return set()
    text = OUT_FILE.read_text(encoding="utf-8")
    return set(re.findall(r'"id":\s*"(yx-[^"]+)"', text))


def load_radiopotok_names() -> set[str]:
    """Читает stations-data.js и возвращает имена для дедупликации."""
    if not EXISTING_IDS_FILE.exists():
        return set()
    text = EXISTING_IDS_FILE.read_text(encoding="utf-8", errors="ignore")
    names = re.findall(r'"name":\s*"([^"]+)"', text)
    return {n.lower().strip() for n in names}


def build_station(slug: str, info: dict, rp_names: set[str]) -> dict | None:
    stream = KNOWN_STREAMS.get(slug, "")
    if not stream:
        return None  # нет stream — пропускаем

    title = info.get("title") or slug
    # Нормализация названия — убираем мусор из og:title
    for noise in [" — Яндекс Радио", " - Яндекс Радио", " - слушать онлайн",
                  " — слушать онлайн"]:
        title = title.replace(noise, "")
    # Убираем " Москва XXX FM", " Москва", " Россия" в конце
    title = re.sub(r'\s+(?:Москва|Россия)(?:\s+\d+[\d.]*\s*FM)?$', '', title).strip()

    # Проверяем дубли по имени с RadioPotok
    if title.lower().strip() in rp_names:
        print(f"  DUP (radiopotok) {slug}: «{title}» — пропускаем")
        return None

    cover = info.get("coverUri") or ""
    # Убираем размер в конце и добавляем /300x300
    cover = re.sub(r'/(?:\d+x\d+|orig|m\d+x\d+)(/\d+x\d+)?$', '', cover)
    if cover:
        cover = cover.rstrip("/") + "/300x300"

    genre = GENRE_MAP.get(slug, "Поп")
    desc = DESC_MAP.get(slug, "Станция Яндекс Радио.")
    tags = TAG_MAP.get(slug, [genre, "Хиты"])

    return {
        "id": f"yx-{slug}",
        "name": title,
        "stream": stream,
        "sourceUrl": f"{BASE}/station/{slug}",
        "logoUrl": cover,
        "description": desc,
        "genre": genre,
        "listeners": "Яндекс Радио",
        "tags": tags,
    }


def main() -> None:
    print("=== Яндекс Радио скрейпер ===")
    print("Загружаю главную страницу...")
    html = fetch(BASE + "/")
    print(f"Получено {len(html):,} символов")

    # Извлекаем slug'и
    raw = extract_stations_from_html(html)
    slugs = [s["id"] for s in raw if s["id"] not in ("logo-color", "undefined")]
    print(f"Slug'ов для обхода: {len(slugs)}")

    # Обогащаем информацией со страниц станций
    print("\nЗагружаю страницы станций...")
    enriched: dict[str, dict] = {}
    for i, slug in enumerate(slugs, 1):
        if slug in ("logo-color", "undefined"):
            continue
        print(f"  [{i}/{len(slugs)}] {slug}", end=" ")
        info = enrich_station(slug)
        if info:
            enriched[slug] = info
            print(f"    OK: {info['title']}")
        time.sleep(0.3)  # не спамим

    # Фильтруем и собираем ВСЕ станции (пересобираем всё с нуля)
    rp_names = load_radiopotok_names()
    print(f"\nРадиопоток: {len(rp_names)} имён для дедупликации")

    result: list[dict] = []
    skipped_rp: list[str] = []
    skipped_nostream: list[str] = []
    for slug, info in enriched.items():
        station = build_station(slug, info, rp_names)
        if station:
            result.append(station)
        elif KNOWN_STREAMS.get(slug) == "":
            pass  # явно помечено как не-станция (logo-color и т.п.)
        elif slug not in KNOWN_STREAMS:
            skipped_nostream.append(slug)
        else:
            skipped_rp.append(slug)

    if skipped_nostream:
        print(f"  Нет stream (не добавлены): {', '.join(skipped_nostream)}")
    if skipped_rp:
        print(f"  Дубли с RadioPotok: {', '.join(skipped_rp)}")

    print(f"\nИтого станций: {len(result)}")

    # Формируем JS
    js_items = []
    for s in result:
        tags_str = ", ".join(f'"{t}"' for t in s["tags"])
        js_items.append(
            f"""    {{
        "id": "{s['id']}",
        "name": "{s['name']}",
        "stream": "{s['stream']}",
        "sourceUrl": "{s['sourceUrl']}",
        "logoUrl": "{s['logoUrl']}",
        "description": "{s['description']}",
        "genre": "{s['genre']}",
        "listeners": "Яндекс Радио",
        "tags": [{tags_str}]
    }}"""
        )

    js = "window.YANDEX_STATIONS = [\n" + ",\n".join(js_items) + "\n];\n"

    OUT_FILE.write_text(js, encoding="utf-8")
    print(f"Записано в {OUT_FILE}")
    print("Станции:")
    for s in result:
        print(f"  {s['id']:35s}  {s['name']}")


if __name__ == "__main__":
    main()
