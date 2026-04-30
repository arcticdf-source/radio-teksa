import requests

API = "https://de1.api.radio-browser.info/json/stations/search"
headers = {"User-Agent": "AllRadio/1.0"}

queries = {
    "dorognoe":   {"name": "дорожное радио",    "countrycode": "RU", "limit": 3},
    "monte-carlo":{"name": "монте карло",        "countrycode": "RU", "limit": 3},
    "rbk":        {"name": "радио рбк",          "countrycode": "RU", "limit": 3},
    "top-radio":  {"name": "топ радио",          "countrycode": "RU", "limit": 3},
    "radio-c":    {"name": "радио си",           "countrycode": "RU", "limit": 3},
    # английские названия тоже
    "dorognoe-en":{"name": "dorognoe",           "countrycode": "RU", "limit": 3},
    "mc-en":      {"name": "monte carlo",        "countrycode": "RU", "limit": 3},
    "rbc-en":     {"name": "rbc radio",          "countrycode": "RU", "limit": 3},
    "top-en":     {"name": "top radio",          "countrycode": "RU", "limit": 3},
    "radioc-en":  {"name": "radio si",           "countrycode": "RU", "limit": 3},
}

for k, params in queries.items():
    try:
        r = requests.get(API, params=params, headers=headers, timeout=10)
        data = r.json()
        if data:
            for s in data:
                print(f"{k}: [{s['votes']}v] {s['name']} -> {s['url_resolved']}")
        else:
            print(f"{k}: NOT FOUND")
    except Exception as e:
        print(f"{k}: ERROR {e}")
