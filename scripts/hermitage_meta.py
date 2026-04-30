import requests, re

r = requests.get('https://hermitage.fm/', timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

# og tags
for tag in ['og:image', 'og:title', 'og:description', 'og:site_name']:
    m = re.findall(f'property="{tag}"[^>]+content="([^"]+)"', text)
    if not m:
        m = re.findall(f'content="([^"]+)"[^>]+property="{tag}"', text)
    print(f'{tag}: {m}')

# meta description
desc = re.findall(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', text)
print('description:', desc)

# logo/icon links
icons = re.findall(r'<link[^>]+(?:icon|logo|apple)[^>]+href="([^"]+)"', text)
print('icons:', icons[:5])

# find all img src
imgs = re.findall(r'<img[^>]+src="([^"]+)"', text)
print('images:', imgs[:10])
