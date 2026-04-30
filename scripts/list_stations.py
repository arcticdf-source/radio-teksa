import json, re, sys

# Read stations-data.js
with open('stations-data.js', encoding='utf-8-sig') as f:
    text = f.read()

text = text.strip()
if text.startswith('window.STATIONS'):
    text = text[text.index('['): text.rindex(']')+1]

stations = json.loads(text)

names = [s['name'] for s in stations]
with open('scripts/names.txt', 'w', encoding='utf-8') as out:
    for n in sorted(names):
        out.write(n + '\n')
    out.write(f'\nTotal: {len(stations)}\n')

print('Done:', len(stations))

