import requests
import socket
requests.packages.urllib3.disable_warnings()

# Timeout-станции - пробуем HTTP вместо HTTPS
http_streams = {
    "radiovanya":  "http://vanya.hostingradio.ru:8027/vanya128.mp3",
    "dacha":       "http://dcha.hostingradio.ru:8027/dcha128.mp3",
    "retro-fm":    "http://retro.hostingradio.ru:8041/retro128.mp3",
    "love-radio":  "http://love.hostingradio.ru:8027/love128.mp3",
    "jazz":        "http://jazz.hostingradio.ru:8027/jazz128.mp3",
    "business-fm": "http://businessfm.hostingradio.ru:8027/businessfm128.mp3",
    "top-radio":   "http://topradio.hostingradio.ru/topradio128.mp3",
}

# SSL-станции - пробуем через hls-01-gpm (GPM холдинг)
# + альтернативные mp3 форматы
alt_streams = {
    "energy-hls":   "https://hls-01-gpm.hostingradio.ru/energyfm3902/playlist.m3u8",
    "relax-hls":    "https://hls-01-gpm.hostingradio.ru/relaxfm843/playlist.m3u8",
    "hit-fm-hls":   "https://hls-01-hitfm.hostingradio.ru/hitfm/playlist.m3u8",
    "pi-fm-http":   "http://pifm.hostingradio.ru/pifm128.mp3",
    "radio-c-http": "http://radioc.hostingradio.ru/radioc128.mp3",
}

# 404-станции - пробуем варианты URL
variants_404 = {
    "dorognoe-v1":     "http://dorognoe.hostingradio.ru/dorognoe128.mp3",
    "dorognoe-v2":     "https://dorognoe1.hostingradio.ru:80/dorognoe-128.mp3",
    "dorognoe-v3":     "http://dorodnoe.hostingradio.ru/dorodnoe128.mp3",
    "record-v1":       "http://radiorecord.hostingradio.ru/rr_128/stream",
    "record-v2":       "https://radiorecord.hostingradio.ru:8000/rr_128",
    "hit-fm-v1":       "http://hitfm.hostingradio.ru:8027/hitfm128.mp3",
    "hit-fm-v2":       "http://hitfm1.hostingradio.ru:80/hitfm-128.mp3",
    "monte-carlo-v1":  "http://montecarlo.hostingradio.ru:8027/montecarlo128.mp3",
    "monte-carlo-v2":  "http://montecarlo1.hostingradio.ru:80/montecarlo-128.mp3",
    "rbk-v1":          "http://rbc.hostingradio.ru/rbc128.mp3",
    "rbk-v2":          "https://rbk.hostingradio.ru/rbk128.mp3",
}

headers = {'User-Agent': 'Mozilla/5.0'}

def test(name, url):
    try:
        r = requests.get(url, headers=headers, timeout=6, stream=True)
        ct = r.headers.get('Content-Type', '')
        print(f"OK  {name}: {r.status_code} {ct[:30]}")
        r.close()
    except requests.exceptions.ReadTimeout:
        print(f"TIMEOUT {name}: (read timeout, server streamed but no close)")
    except Exception as e:
        print(f"FAIL {name}: {str(e)[:80]}")

print("=== HTTP variants (was timeout) ===")
for k, v in http_streams.items():
    test(k, v)

print("\n=== SSL-fixed / HLS variants ===")
for k, v in alt_streams.items():
    test(k, v)

print("\n=== 404 fix attempts ===")
for k, v in variants_404.items():
    test(k, v)
