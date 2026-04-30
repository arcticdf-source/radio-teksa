import requests, re

def get_streams(url):
    try:
        r = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        text = r.text
        m = re.findall(r'"stream_url"\s*:\s*"([^"]+)"', text)
        if m:
            return m[:5]
        m2 = re.findall(r'https?://[^\s"\'<>]+\.(?:mp3|aac|m3u8|m3u)[^\s"\'<>]*', text)
        return list(dict.fromkeys(m2))[:5] if m2 else ['NOT FOUND']
    except Exception as e:
        return [f'ERROR: {e}']

sites = {
    'chanson':     'https://radioshanson.ru/',
    'dorognoe':    'https://dorognoeradio.ru/',
    'dacha':       'https://radiodacha.ru/',
    'retro-fm':    'https://retro-fm.ru/',
    'record':      'https://radiorecord.ru/',
    'hit-fm':      'https://hitfm.ru/',
    'monte-carlo': 'https://montecarlo.fm/',
    'love-radio':  'https://loveradio.ru/',
    'energy':      'https://energyfm.ru/',
    'jazz':        'https://radiojazzfm.ru/',
    'relax-fm':    'https://relaxfm.ru/',
    'business-fm': 'https://businessfm.ru/',
    'radiovanya':  'https://radiovannya.ru/',
    'pi-fm':       'https://pifm.ru/',
    'top-radio':   'https://www.topradio.ru/',
    'rbk':         'https://www.rbc.ru/radio/',
    'radio-c':     'https://www.radioc.ru/',
}

for k, url in sites.items():
    res = get_streams(url)
    print(f'{k}: {res}')
