#!/usr/bin/env python3
"""Generate house cusp test vectors only; Swiss Ephemeris is not an app dependency.

Usage: PYTHONPATH=<pyswisseph directory> python tools/generate-house-systems-reference.py
Requires pyswisseph wrapping Swiss Ephemeris 2.10.03. No ephemeris files are
needed: houses_armc_ex2 takes the sky frame (RAMC, latitude, obliquity) and
reads no positions. Writes tools/fixtures/house-systems-swiss.json, which
tools/run-module-tests.js holds app/house-systems.js to.
"""
import json
from pathlib import Path
import swisseph as swe

if swe.version != '2.10.03':
    raise SystemExit('Review reference version before changing the baseline: ' + swe.version)

# The app's key for each system, and the letter Swiss Ephemeris uses for it.
# The two differ for Porphyry (O there), Placidus (P there) and Alcabitius (B).
SYSTEMS = {'W': b'W', 'E': b'E', 'P': b'O', 'O': b'P', 'K': b'K', 'R': b'R',
           'C': b'C', 'A': b'B', 'T': b'T', 'M': b'M', 'X': b'X'}
# Both polar circles, the tropics, the equator and the places the client
# accuracy reference already uses (Sydney, Edison, Reykjavik, Longyearbyen).
LATS = [-75, -66, -60, -45, -33.8688, -10, 0, 5, 23.4, 40.51872, 51.5, 60,
        64.1466, 66, 70, 78.2232]
EPS = 23.4392911
rows = []
for lat in LATS:
    for k in range(24):
        ramc = k * 15 + (7.3 if k % 2 else 0)
        row = {'lat': lat, 'ramc': ramc, 'eps': EPS, 'cusps': {}}
        for key, letter in SYSTEMS.items():
            try:
                cusps, ascmc = swe.houses_armc_ex2(ramc, lat, EPS, letter)[:2]
                row['cusps'][key] = [round(c, 8) for c in cusps[:12]]
                row['asc'] = round(ascmc[0], 8)
                row['mc'] = round(ascmc[1], 8)
            except swe.Error:
                row['cusps'][key] = 'polar'
        rows.append(row)
out = Path(__file__).resolve().parent / 'fixtures' / 'house-systems-swiss.json'
out.write_text(json.dumps({
    'source': 'Swiss Ephemeris ' + swe.version + ' swe_houses_armc_ex2',
    'note': 'Keys are the app keys in app/house-systems.js. "polar" means Swiss refused the system there.',
    'rows': rows}, separators=(',', ':')) + '\n')
print(len(rows), 'rows ->', out)
