import csv
import datetime as dt
import json
import math
import pathlib
import tempfile
import os
import urllib.parse
import urllib.request

HERE = pathlib.Path(os.environ.get('HYAKUTAKE_CACHE_DIR', pathlib.Path(tempfile.gettempdir()) / 'hyakutake-jpl'))
HERE.mkdir(parents=True, exist_ok=True)
CMD = 'DES=1996 B2;CAP <1997;NOFRAG'
EPOCH = dt.datetime(2000, 1, 1, 12)


def fetch(label, start, stop, step):
    target = HERE / f'hyakutake_{label}.json'
    if target.exists():
        return json.loads(target.read_text())
    params = {
        'format': 'text', 'COMMAND': f"'{CMD}'", 'MAKE_EPHEM': 'YES',
        'EPHEM_TYPE': 'OBSERVER', 'CENTER': "'500@399'",
        'START_TIME': f"'{start}'", 'STOP_TIME': f"'{stop}'",
        'STEP_SIZE': f"'{step}'", 'QUANTITIES': "'31,38'",
        'CSV_FORMAT': 'YES', 'ANG_FORMAT': 'DEG', 'TIME_TYPE': 'UT',
    }
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(params)
    raw = urllib.request.urlopen(url, timeout=120).read().decode()
    if '$$SOE' not in raw or '$$EOE' not in raw:
        raise RuntimeError(raw[:2000])
    head = raw[:raw.index('$$SOE')]
    body = raw.split('$$SOE', 1)[1].split('$$EOE', 1)[0]
    rows = []
    for parts in csv.reader(body.strip().splitlines()):
        when = dt.datetime.strptime(parts[0].strip(), '%Y-%b-%d %H:%M')
        days = (when - EPOCH).total_seconds() / 86400
        rows.append([round(days, 9), float(parts[3]), float(parts[-2])])
    out = {'command': CMD, 'observer': '500@399', 'quantities': '31,38',
           'start': start, 'stop': stop, 'step': step,
           'solution': head[head.find('Rec #:'):head.find('Rec #:') + 190],
           'rows': rows}
    target.write_text(json.dumps(out, separators=(',', ':')))
    return out


def cubic(y, x, t):
    z = 0
    for i in range(4):
        k = 1
        for j in range(4):
            if i != j:
                k *= (t - x[j]) / (x[i] - x[j])
        z += k * y[i]
    return z


if __name__ == '__main__':
    import sys
    from bisect import bisect_right
    step = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    year0 = int(sys.argv[2]) if len(sys.argv) > 2 else 1900
    year1 = int(sys.argv[3]) if len(sys.argv) > 3 else 2100
    begin = dt.datetime(year0, 1, 1)
    stop = dt.datetime(year1, 1, 1)
    half_start = begin + dt.timedelta(days=step / 2)
    start_mid = half_start.strftime('%Y-%m-%d %H:%M')
    coarse = fetch(f'coarse{step}_{year0}_{year1}', begin.strftime('%Y-%m-%d %H:%M'), stop.strftime('%Y-%m-%d %H:%M'), f'{step} d')['rows']
    middle = fetch(f'middle{step}_{year0}_{year1}', start_mid, stop.strftime('%Y-%m-%d %H:%M'), f'{step} d')['rows']
    xs = [r[0] for r in coarse]
    unwrapped = [coarse[0][1]]
    for row in coarse[1:]:
        d = (row[1] - unwrapped[-1] + 180) % 360 - 180
        unwrapped.append(unwrapped[-1] + d)
    errors = []
    for t, lon, sig in middle:
        k = bisect_right(xs, t) - 1
        if k < 1 or k + 2 >= len(xs):
            continue
        xx = xs[k-1:k+3]
        yy = unwrapped[k-1:k+3]
        guess = cubic(yy, xx, t) % 360
        diff = (guess - lon + 180) % 360 - 180
        year = (EPOCH + dt.timedelta(days=t)).year
        errors.append((abs(diff) * 3600, year, str(EPOCH + dt.timedelta(days=t)), diff * 3600))
    errors.sort(reverse=True)
    print('coarse/mid rows', len(coarse), len(middle), 'worst arcsec')
    for e in errors[:25]: print(e)
    stable = [e for e in errors if e[1] < 1994 or e[1] > 1998]
    print('outside 1994-1998:', stable[:10])
