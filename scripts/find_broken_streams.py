import requests, re
requests.packages.urllib3.disable_warnings()

def search_stream(url, verify=True):
    try:
        r = requests.get(url, timeout=10, verify=verify,
                         headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        text = r.text
        # stream_url field
        m = re.findall(r'"stream_url"\s*:\s*"([^"]+)"', text)
        if m:
            return [re.sub(r'\?.*', '', u) for u in m[:5]]
        # known streaming domains
        m2 = re.findall(r'https?://[a-zA-Z0-9._-]+\.(?:hostingradio|icecast|shoutcast|stream)[^\s"\'<>\\]+', text)
        if m2:
            return list(dict.fromkeys([re.sub(r'\?.*', '', u).rstrip('\\') for u in m2]))[:5]
        # generic mp3/m3u8
        m3 = re.findall(r'https?://[^\s"\'<>\\]+\.(?:mp3|aac|m3u8|m3u)[^\s"\'<>]*', text)
        if m3:
            return list(dict.fromkeys([re.sub(r'\?.*', '', u).rstrip('\\') for u in m3]))[:5]
        return [f'NOT FOUND ({r.status_code})']
    except Exception as e:
        return [f'ERROR: {str(e)[:100]}']

sites = {
    'dorognoe-1': ('https://dorognoeradio.ru/online/', False),
    'dorognoe-2': ('https://dorognoeradio.ru/', False),
    'montecarlo':  ('https://www.radiomontecarlo.net/', True),
    'montecarlo2': ('https://montecarlo.ru/', True),
    'rbk-radio':   ('https://radio.rbc.ru/', True),
    'rbk-api':     ('https://online.rbc.ru/radio/', True),
    'topradio':    ('https://www.topradio.ru/', True),
    'radioc':      ('https://radioc.ru/', True),
    'radioc2':     ('https://www.radioc.ru/online/', True),
}

for k, (url, verify) in sites.items():
    res = search_stream(url, verify)
    print(f'{k}: {res}')
