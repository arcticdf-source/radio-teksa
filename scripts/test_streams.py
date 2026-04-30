import requests
requests.packages.urllib3.disable_warnings()

streams = {
    "radiovanya":      "https://vanya.hostingradio.ru:8027/vanya128.mp3",
    "chanson":         "https://chanson.hostingradio.ru:8041/chanson128.mp3",
    "dorognoe":        "https://dorognoe.hostingradio.ru/dorognoe128.mp3",
    "dacha":           "https://dcha.hostingradio.ru:8027/dcha128.mp3",
    "retro-fm":        "https://retro.hostingradio.ru:8041/retro128.mp3",
    "record":          "https://radiorecord.hostingradio.ru/rr_128/stream",
    "hit-fm":          "https://hitfm.hostingradio.ru:8027/hitfm128.mp3",
    "monte-carlo":     "https://montecarlo.hostingradio.ru:8027/montecarlo128.mp3",
    "love-radio":      "https://love.hostingradio.ru:8027/love128.mp3",
    "energy":          "https://energy.hostingradio.ru/energy128.mp3",
    "nashe":           "https://nashe1.hostingradio.ru:80/nashe-128.mp3",
    "jazz":            "https://jazz.hostingradio.ru:8027/jazz128.mp3",
    "pi-fm":           "https://pifm.hostingradio.ru/pifm128.mp3",
    "relax-fm":        "https://relax.hostingradio.ru/relax128.mp3",
    "business-fm":     "https://businessfm.hostingradio.ru:8027/businessfm128.mp3",
    "rbk":             "https://rbc.hostingradio.ru/rbc128.mp3",
    "top-radio":       "https://topradio.hostingradio.ru/topradio128.mp3",
    "radio-c":         "https://radioc.hostingradio.ru/radioc128.mp3",
}

headers = {'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-1023'}
for name, url in streams.items():
    try:
        r = requests.get(url, headers=headers, timeout=8, stream=True)
        ct = r.headers.get('Content-Type', '')
        print(f"OK  {name}: {r.status_code} {ct}")
        r.close()
    except Exception as e:
        print(f"FAIL {name}: {e}")
