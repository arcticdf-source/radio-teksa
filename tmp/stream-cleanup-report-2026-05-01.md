# Stream Cleanup Report - 2026-05-01

- Imported stations tested: 677
- Stations whose original stream failed browser playback check: 257
- Auto-resolve matches found via radio-browser and browser probe: 32
- High-confidence replacements applied to `stations-data.js`: 14
- Remaining unresolved IDs after this pass: 225

## Applied replacements

- `rp-1010` Первое сетевое: `https://streamer.radiovseti.ru:8000/64` -> `https://streamer.radiovseti.ru:8000/320`
- `rp-1155` Радио Гамаюн: `https://5.restream.one/1155_1` -> `https://gamaun.online:8025/radio`
- `rp-1230` Sideline FM: `https://air.volna.top/SideLine48?type=.flv` -> `https://air.volna.top/SideLine48`
- `rp-1323` Маруся ФМ: `https://radio-holding.ru:9433/marusya_default` -> `https://listen.vdfm.ru:8000/marusya`
- `rp-1336` Vintage Radio: `https://stream.zeno.fm/achgsffv1qruv` -> `https://vintageradio.ice.infomaniak.ch/vintageradio-high.mp3`
- `rp-1362` Радио Родных Дорог: `https://stream1.radiord.ru:8000/live96.aac?type=.flv` -> `https://stream1.radiord.ru:8000/live128.mp3`
- `rp-1454` Secret Agent: `https://5.restream.one/1454_1` -> `https://ice6.somafm.com/secretagent-128-mp3`
- `rp-1486` Dream FM: `https://5.restream.one/1486_1` -> `https://neos.win:48420/stream`
- `rp-2138` Break Radio: `https://breakradio.ice.infomaniak.ch/breakradio-128.aac` -> `https://breakradio.ice.infomaniak.ch/breakradio-192.mp3`
- `rp-495` Радио Звезда: `https://icecast-zvezda.mediacdn.ru/radio/zvezda/zvezda_128` -> `https://zvezda-radio128.mediacdn.ru/radio/zvezda/zvezda_128`
- `rp-61` Radio Swiss Jazz: `https://stream.srg-ssr.ch/m/rsj/aacp_96?type=.flv` -> `https://stream.srg-ssr.ch/m/rsj/mp3_128`
- `rp-679` Deep One: `https://stream.deep1.ru/deep1aac` -> `https://stream.deep1.ru/deep1mp3`
- `rp-817` Голос Ангары: `https://5.restream.one/817_1` -> `https://radiopotok2.online/http://91.189.162.134:8006/;stream.nsv`
- `rp-900` Олдхит: `https://5.restream.one/900_1` -> `https://oldxit.ru:8005/radio`

## Candidate replacements found but not auto-applied

- `rp-104` KEXP 90.3 FM -> `https://kexp-mp3-128.streamguys1.com/kexp128.mp3` (same URL as current)
- `rp-1458` Hits Of Bollywood -> `https://stream-146.zeno.fm/rqqps6cbe3quv?zs=loHp_DNyRPiAxC52AL95hg`
- `rp-1461` Музыка мюзиклов -> `https://channels.fonotron.ru:8000/Chan_66_256.mp3`
- `rp-1631` IDS Radio -> `https://naxidigital-kids128ssl.streaming.rs:8052/;`
- `rp-1752` J Radio -> `https://eu4.fastcast4u.com/proxy/aabdul00?mp=/1`
- `rp-1812` Радио 1 -> `https://c2.radioboss.fm/stream/394`
- `rp-1876` Rock Radio -> `https://kathy.torontocast.com:2800/;`
- `rp-1964` ONE FM -> `https://stream.zeno.fm/xna2aad7gc9uv`
- `rp-2015` Dolce Vita -> `https://gr.fluidstream.eu/gr7.mp3`
- `rp-2110` RADIO24 -> `https://chmedia.streamabc.net/79-r24-mp3-192-6659699?sABC=696840ro%230%23srp58oqr2q0127pq92r8qr5o3p87s1no%23qverpg&aw_0_1st.playerid=direct&amsparams=playerid:direct;skey:1768440043`
- `rp-2188` Radio Under -> `https://radio.underland.team/radio/8000/radio.mp3`
- `rp-2207` Power HIT Radio -> `https://ice.leviracloud.eu/phr192-mp3`
- `rp-50` Radio Paradise -> `https://stream.radioparadise.com/rock-flac`
- `rp-543` Revolution Radio -> `https://securestreams6.autopo.st:2332/stream?1714719388872`
- `rp-766` Radio Metro -> `https://s2.yesstreaming.net:9088/stream`
- `rp-80` Радио Сибирь -> `https://stream.radiosibir.ru:8093/HQ`
- `rp-947` Happy Radio -> `https://uksoutha.streaming.broadcast.radio/stream/11340/gtradio?1672903939995`
- `rp-95` Radio Bob! -> `https://streams.radiobob.de/symphmetal/mp3-192/streams.radiobob.de/`

## Unresolved IDs

```text
rp-1002, rp-1004, rp-1025, rp-103, rp-1032, rp-1034, rp-1048, rp-1060, rp-1067, rp-1089,
rp-110, rp-1105, rp-1108, rp-1109, rp-1113, rp-112, rp-1131, rp-1135, rp-1137, rp-1138,
rp-1143, rp-1163, rp-1168, rp-1177, rp-118, rp-1209, rp-1215, rp-1218, rp-1236, rp-1242,
rp-1243, rp-1244, rp-1251, rp-1258, rp-1264, rp-127, rp-1308, rp-1324, rp-1327, rp-1328,
rp-1333, rp-1374, rp-138, rp-1386, rp-1399, rp-1403, rp-1405, rp-142, rp-1427, rp-1432,
rp-1441, rp-145, rp-1450, rp-1459, rp-1460, rp-1464, rp-1465, rp-1468, rp-147, rp-1470,
rp-1476, rp-1478, rp-1484, rp-1485, rp-1492, rp-1519, rp-1558, rp-1561, rp-1562, rp-1569,
rp-1574, rp-158, rp-1580, rp-1589, rp-1607, rp-1616, rp-1627, rp-1642, rp-1643, rp-1649,
rp-1658, rp-1676, rp-1677, rp-1683, rp-1701, rp-1745, rp-1746, rp-1747, rp-1758, rp-1759,
rp-1767, rp-1774, rp-1781, rp-1802, rp-1803, rp-1810, rp-1817, rp-1822, rp-1827, rp-1831,
rp-1834, rp-184, rp-1845, rp-1867, rp-1875, rp-1879, rp-1881, rp-1883, rp-1886, rp-1887,
rp-1903, rp-1907, rp-1914, rp-1920, rp-1922, rp-1923, rp-1935, rp-1939, rp-1943, rp-1963,
rp-1973, rp-1981, rp-2000, rp-2006, rp-2012, rp-2023, rp-2026, rp-2035, rp-2041, rp-2042,
rp-2045, rp-2047, rp-2056, rp-2058, rp-2067, rp-2074, rp-2084, rp-2086, rp-2093, rp-2109,
rp-2112, rp-2116, rp-2127, rp-2137, rp-2154, rp-2158, rp-2167, rp-2176, rp-2178, rp-2187,
rp-2189, rp-2190, rp-2196, rp-2204, rp-2205, rp-2206, rp-221, rp-2229, rp-2230, rp-2231,
rp-2241, rp-2242, rp-2246, rp-2254, rp-2259, rp-2264, rp-2266, rp-2267, rp-2271, rp-2274,
rp-291, rp-316, rp-34, rp-361, rp-364, rp-369, rp-406, rp-42, rp-420, rp-423,
rp-427, rp-436, rp-44, rp-457, rp-471, rp-472, rp-485, rp-488, rp-491, rp-541,
rp-56, rp-561, rp-57, rp-59, rp-60, rp-617, rp-626, rp-639,
rp-657, rp-658, rp-660, rp-67, rp-692, rp-771, rp-772, rp-801, rp-803, rp-814,
rp-816, rp-829, rp-836, rp-837, rp-88, rp-880, rp-889, rp-910, rp-915, rp-94,
rp-940, rp-944, rp-955, rp-957, rp-963, rp-982
```

Notes:

- The unresolved list is based on a browser-level probe of the imported stream URL plus a limited radio-browser recovery pass.
- `rp-523` and `rp-526` were restored to their original repository streams after an overly broad patch hit the wrong objects.
- Candidate-only replacements were intentionally not applied where the station identity looked ambiguous, generic, or likely mapped to a different brand/feed.