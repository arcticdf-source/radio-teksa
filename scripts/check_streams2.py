import requests, re
requests.packages.urllib3.disable_warnings()

def get_streams(url, verify=True):
    try:
        r = requests.get(url, timeout=10, verify=verify,
                         headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        text = r.text
        m = re.findall(r'"stream_url"\s*:\s*"([^"]+)"', text)
        if m:
            clean = [re.sub(r'\?.*', '', u) for u in m]
            return list(dict.fromkeys(clean))[:5]
        m2 = re.findall(r'https?://[^\s"\'<>\\]+\.(?:mp3|aac|m3u8|m3u)[^\s"\'<>]*', text)
        clean2 = [re.sub(r'\?.*', '', u).rstrip('\\') for u in m2]
        return list(dict.fromkeys(clean2))[:5] if clean2 else ['NOT FOUND']
    except Exception as e:
        return [f'ERROR: {e}']

ssl_sites = {
    'dorognoe':    'https://dorognoeradio.ru/',
    'retro-fm':    'https://retro-fm.ru/',
    'relax-fm':    'https://relaxfm.ru/',
    'business-fm': 'https://businessfm.ru/',
}

alt_sites = {
    'dacha':        'https://www.radiodacha.ru/',
    'record':       'https://www.radiorecord.ru/',
    'love-radio':   'https://loveradio.ru/efir/',
    'jazz':         'https://radiojazzfm.ru/online/',
    'pi-fm':        'https://pifm.ru/online/',
    'top-radio':    'https://www.topradio.ru/online/',
    'rbk':          'https://www.rbc.ru/radio/online/',
    'radio-c':      'https://radioc.ru/',
    'radiovanya':   'https://radio-vanya.ru/',
    'montecarlo':   'https://www.radiomontecarlo.net/',
    'energy-mp3':   'https://energyfm.ru/',
    'hit-fm-mp3':   'https://hitfm.ru/',
}

print("=== SSL sites (no verify) ===")
for k, url in ssl_sites.items():
    res = get_streams(url, verify=False)
    print(f'{k}: {res}')

print("\n=== Alt sites ===")
for k, url in alt_sites.items():
    res = get_streams(url)
    print(f'{k}: {res}')
