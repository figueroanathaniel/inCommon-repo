# Branch sweep, 28 October 2026

Asked for by the owner on 28 October 2026: clear the dead branches before the
task forces start work. Every branch below is finished: its pull request is
merged or closed, or it never had one. Only `main` and the six
`taskforce/<nn>-<slug>` branches carry work forward, plus
`docs/outsourcing-task-forces` until its pull request merges.

**Nothing below has been deleted yet.** Deleting a branch on GitHub is refused
to the agent sessions, so the owner runs the commands at the end, or deletes
the branches from GitHub's Branches page.

## Nothing is lost by deleting them

- **in main**: every commit on the branch is already in main.
- **kept by PR #n**: the branch's last commit is held by that pull request,
  so the branch can be restored from it with GitHub's Restore branch button.
- **archive tag first**: commits that are in no pull request and not in main.
  Step 1 tags each as `archive/<branch>` before step 2 deletes it, so the
  work stays one `git checkout archive/<branch>` away. Read them before
  deciding they are dead; `celestial-codex` and `claude/wizardly-davinci-gc1xv3`
  in particular may hold work that never reached main.

| Branch | Tip | Commits not in main | Where they survive |
|---|---|---|---|
| `claude/always-2d` | `6bda92b` | 0 | in main |
| `claude/astrology-ledger` | `82095e7` | 0 | in main |
| `claude/astrology-stage` | `75b1359` | 0 | in main |
| `claude/astropedia-room` | `1214107` | 0 | in main |
| `claude/book-of-numbers` | `db4cee9` | 0 | in main |
| `claude/builds-v6.4` | `26843d0` | 0 | in main |
| `claude/cycle-audit` | `92903e5` | 0 | in main |
| `claude/cycle-orbit-rings` | `637dc18` | 0 | in main |
| `claude/delegation-1-instructions-bhpilx` | `015c6c6` | 0 | in main |
| `claude/drift-check-tool` | `6464dab` | 0 | in main |
| `claude/f1-alignment` | `ee564fa` | 0 | in main |
| `claude/friendly-meitner-tllm0n` | `fc45c91` | 0 | in main |
| `claude/gazetteer-rio-piedras` | `b0dad68` | 0 | in main |
| `claude/harness-debug-log` | `2bdf82b` | 0 | in main |
| `claude/hd-reading-deck` | `b9b59a8` | 0 | in main |
| `claude/hd-stage` | `3b6a2e2` | 0 | in main |
| `claude/library-shelf` | `f38ec3b` | 0 | in main |
| `claude/modest-faraday-rt51f9` | `2a0f041` | 0 | in main |
| `claude/numbers-stage` | `799c3c5` | 0 | in main |
| `claude/observatory` | `dd02ee6` | 0 | in main |
| `claude/ring-cover-registration` | `b784ad3` | 0 | in main |
| `claude/scene-direct-3d` | `8584e19` | 0 | in main |
| `claude/scene-loading-freelook` | `bd10928` | 0 | in main |
| `claude/scene-veil-fade` | `e7771ff` | 0 | in main |
| `claude/views-2d-first` | `16f1042` | 0 | in main |
| `docs/hd-upgrade` | `4e94e27` | 0 | in main |
| `docs/outsourcing` | `c8073bc` | 0 | in main |
| `figueroanathaniel-patch-oracle-voice` | `846ddc9` | 0 | in main |
| `fix/precision-points-jpl` | `2b31f2c` | 0 | in main |
| `fix/registration-card-guest-save` | `9f41f2f` | 0 | in main |
| `fix/registration-card-signed-in` | `c78be79` | 0 | in main |
| `fix/routed-back-entry` | `b8b07d9` | 0 | in main |
| `fix/swipe-mid-flight` | `30ad9ab` | 0 | in main |
| `fix/verified-calculator-repairs` | `fb43235` | 0 | in main |
| `perf/meta-image-toolkit` | `16009f4` | 0 | in main |
| `qa/h11-deterministic` | `620f436` | 0 | in main |
| `schema/data-map-20261027` | `460156e` | 0 | in main |
| `sol/threejs-lifecycle-20261026` | `23d8a9c` | 0 | in main |
| `sol/threejs-mobile-perf-20261026` | `6a6f8f9` | 0 | in main |
| `visuals/globe-frame-cost-20261026` | `d117ef9` | 0 | in main |
| `visuals/stage-resume-20261027` | `1dea636` | 0 | in main |
| `celestial-codex` | `b8d210e` | 2 | archive tag first |
| `claude/chart-dropdowns-flashcards` | `cda086a` | 2 | archive tag first |
| `claude/cool-faraday-v2xsv3` | `3afd69f` | 23 | archive tag first |
| `claude/drift-check-baseline-refresh` | `1ab23db` | 1 | archive tag first |
| `claude/lift-interactive` | `14d2952` | 1 | archive tag first |
| `claude/quirky-einstein-5nleai` | `2441b37` | 90 | archive tag first |
| `claude/wizardly-davinci-gc1xv3` | `cd80993` | 61 | archive tag first |
| `claude/ad-signup-tags` | `b907939` | 15 | kept by PR #44 |
| `claude/astral-body-on-v1.7` | `ffe9789` | 19 | kept by PR #3 |
| `claude/astropedia-planet-astral-body-3vari9` | `287a951` | 8 | kept by PR #2 |
| `claude/charming-wright-4vbibr` | `0cb7ce0` | 35 | kept by PR #23 |
| `claude/elegant-hopper-3o1dvz` | `01f31cd` | 75 | kept by PR #33 |
| `claude/epic-cori-w609r8` | `ec2ea48` | 80 | kept by PR #34 |
| `claude/glowing-app-icon` | `a28f649` | 13 | kept by PR #43 |
| `claude/learn-into-app` | `69057e9` | 23 | kept by PR #46 |
| `claude/magical-cerf-plwk7v` | `b499987` | 2 | kept by PR #40 |
| `claude/magical-thompson-etfgtg` | `a7299e3` | 11 | kept by PR #42 |
| `claude/netlify-app-to-domain` | `a203426` | 25 | kept by PR #47 |
| `claude/scene-first-load` | `2c32ded` | 1 | kept by PR #64 |
| `claude/seo-cover-meta` | `6e1b35b` | 21 | kept by PR #45 |
| `claude/zen-rubin-a8p9bz` | `68b81ee` | 94 | kept by PR #37 |
| `fix/hyakutake-horizons-ephemeris` | `13e8c86` | 11 | kept by PR #86 |
| `visuals/interactive-20261026` | `f263f02` | 1 | kept by PR #95 |

## The commands

From a clone with push rights, in this order:

```
git fetch origin
# 1. archive the 7 branches whose last commits are in no pull request
git push origin b8d210e8e63fbead906448667717cd84d7b6ce3c:refs/tags/archive/celestial-codex
git push origin cda086a4c5e5b912bdcf1f95c4123f4ac3590d77:refs/tags/archive/claude/chart-dropdowns-flashcards
git push origin 3afd69feac4fef84b638ed1c54b0aefbed58425d:refs/tags/archive/claude/cool-faraday-v2xsv3
git push origin 1ab23db490115c30966820070df1cf63c423e68f:refs/tags/archive/claude/drift-check-baseline-refresh
git push origin 14d29520be87fbfb7ff7a1654151246616ae576a:refs/tags/archive/claude/lift-interactive
git push origin 2441b373c23aec701c878d321a5d874db0ba10a4:refs/tags/archive/claude/quirky-einstein-5nleai
git push origin cd809937c80a0103176609f3bce263cdc6ee4b72:refs/tags/archive/claude/wizardly-davinci-gc1xv3
# 2. delete all 64
git push origin --delete \
  claude/always-2d \
  claude/astrology-ledger \
  claude/astrology-stage \
  claude/astropedia-room \
  claude/book-of-numbers \
  claude/builds-v6.4 \
  claude/cycle-audit \
  claude/cycle-orbit-rings \
  claude/delegation-1-instructions-bhpilx \
  claude/drift-check-tool \
  claude/f1-alignment \
  claude/friendly-meitner-tllm0n \
  claude/gazetteer-rio-piedras \
  claude/harness-debug-log \
  claude/hd-reading-deck \
  claude/hd-stage \
  claude/library-shelf \
  claude/modest-faraday-rt51f9 \
  claude/numbers-stage \
  claude/observatory \
  claude/ring-cover-registration \
  claude/scene-direct-3d \
  claude/scene-loading-freelook \
  claude/scene-veil-fade \
  claude/views-2d-first \
  docs/hd-upgrade \
  docs/outsourcing \
  figueroanathaniel-patch-oracle-voice \
  fix/precision-points-jpl \
  fix/registration-card-guest-save \
  fix/registration-card-signed-in \
  fix/routed-back-entry \
  fix/swipe-mid-flight \
  fix/verified-calculator-repairs \
  perf/meta-image-toolkit \
  qa/h11-deterministic \
  schema/data-map-20261027 \
  sol/threejs-lifecycle-20261026 \
  sol/threejs-mobile-perf-20261026 \
  visuals/globe-frame-cost-20261026 \
  visuals/stage-resume-20261027 \
  celestial-codex \
  claude/chart-dropdowns-flashcards \
  claude/cool-faraday-v2xsv3 \
  claude/drift-check-baseline-refresh \
  claude/lift-interactive \
  claude/quirky-einstein-5nleai \
  claude/wizardly-davinci-gc1xv3 \
  claude/ad-signup-tags \
  claude/astral-body-on-v1.7 \
  claude/astropedia-planet-astral-body-3vari9 \
  claude/charming-wright-4vbibr \
  claude/elegant-hopper-3o1dvz \
  claude/epic-cori-w609r8 \
  claude/glowing-app-icon \
  claude/learn-into-app \
  claude/magical-cerf-plwk7v \
  claude/magical-thompson-etfgtg \
  claude/netlify-app-to-domain \
  claude/scene-first-load \
  claude/seo-cover-meta \
  claude/zen-rubin-a8p9bz \
  fix/hyakutake-horizons-ephemeris \
  visuals/interactive-20261026
```

Afterwards `git ls-remote --heads origin` lists `main`, the `taskforce/`
branches and `docs/outsourcing-task-forces` (until it merges) and nothing else.
