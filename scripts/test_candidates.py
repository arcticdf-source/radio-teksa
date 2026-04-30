import requests
requests.packages.urllib3.disable_warnings()

# Кандидаты из radio-browser.info
candidates = {
    "dorognoe":    "http://dorognoe.hostingradio.ru:8000/radio",
    "monte-carlo": "https://montecarlo.hostingradio.ru/montecarlo96.aacp",
    "top-radio":   "https://topradio.live.advailo.com/topradio/live/playlist.m3u8",
    "radio-c":     "https://online.radioc.ru/radioc",
}

# РБК - ищем через API Яндекс Радио (у нас был URL с прошлого сеанса)
# и через другие варианты
rbk_candidates = {
    "rbk-v1": "https://rbc.hostingradio.ru/rbc128.mp3",
    "rbk-v2": "http://rbc.hostingradio.ru/rbc128.mp3",
    "rbk-v3": "http://rbc.hostingradio.ru:8000/rbc128.mp3",
    "rbk-v4": "http://rbk.hostingradio.ru/rbk128.mp3",
    "rbk-v5": "https://radio.rbc.ru/stream/",
}

headers = {'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-1023'}

def test(name, url):
    try:
        r = requests.get(url, headers=headers, timeout=8, stream=True, verify=False)
        ct = r.headers.get('Content-Type', '')
        cl = r.headers.get('Content-Length', '?')
        print(f"OK   {name}: {r.status_code} {ct[:40]} len={cl}")
        r.close()
    except requests.exceptions.ReadTimeout:
        print(f"STREAM {name}: timeout=streaming OK")
    except Exception as e:
        print(f"FAIL {name}: {str(e)[:80]}")

print("=== Main candidates ===")
for k, v in candidates.items():
    test(k, v)

print("\n=== RBK variants ===")
for k, v in rbk_candidates.items():
    test(k, v)
