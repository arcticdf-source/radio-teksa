import urllib.request, ssl, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

stations = [
    ('tabassum-uz', 'http://tabassum.uz'),
    ('sezamfm-com', 'https://sezamfm.com'),
    ('timsolfm-uz', 'https://timsolfm.uz'),
    ('nukusfm-uz', 'http://nukusfm.uz'),
    ('mediamarkaz-com', 'http://mediamarkaz.com'),
    ('temp-fm', 'https://temp.fm'),
    ('maxima-uz', 'https://maxima.uz'),
    ('fm101-uz', 'https://fm101.uz'),
    ('navruzfm-uz', 'https://navruzfm.uz'),
    ('grand-uz', 'https://grand.uz'),
    ('retrofm-uz', 'https://retrofm.uz'),
    ('ozodlik-org', 'https://ozodlik.org'),
    ('muz-uz', 'https://muz.uz'),
    ('oriatdono-uz', 'https://oriatdono.uz'),
    ('qalbimnavosi-uz', 'http://qalbimnavosi.uz'),
    ('islom-uz', 'https://islom.uz'),
]

for slug, url in stations:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=7, context=ctx).read().decode('utf-8', 'ignore')
        
        og = re.search(r'og:image[^>]+content="([^"]+)"', html)
        apple = re.search(r'apple-touch-icon[^>]+href="([^"]+)"', html)
        fav = re.search(r'<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="([^"]+\.(?:png|svg|jpg|webp))"', html)
        logo_img = re.search(r'src="([^"]+(?:logo|brand)[^"]+\.(?:png|svg|jpg|webp))"', html, re.IGNORECASE)
        
        best = ''
        if og: best = og.group(1)
        elif apple: best = apple.group(1)
        elif logo_img: best = logo_img.group(1)
        elif fav: best = fav.group(1)
        
        print(f'{slug}: {best[:120]}')
    except Exception as e:
        print(f'{slug}: ERR {str(e)[:60]}')
