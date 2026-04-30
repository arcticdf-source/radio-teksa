import requests, re

r = requests.get('https://hermitage.fm/', timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

m = re.findall(r'https?://[^\s"\'<>\\]+\.(?:mp3|aac|m3u8|m3u|aacp)[^\s"\'<>]*', text)
print('MP3/AAC/HLS:', list(dict.fromkeys(m))[:5])

m2 = re.findall(r'"stream_url"\s*:\s*"([^"]+)"', text)
print('stream_url:', m2[:5])

m3 = re.findall(r'https?://[a-zA-Z0-9._:-]+(?:/[^\s"\'<>]*)?(?:stream|listen|live|icecast|shoutcast)[^\s"\'<>]*', text)
print('stream-like:', list(dict.fromkeys(m3))[:10])

# ищем og:audio
og = re.findall(r'og:audio[^\n]+', text)
print('og:audio:', og[:3])

# ищем любой audio src
asrc = re.findall(r'<audio[^>]+src=["\']([^"\']+)["\']', text)
print('audio src:', asrc[:3])
