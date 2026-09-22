# harness debug session log

No file by this name existed in the repository before this entry — there is
nothing to append to, so this is the first entry rather than an addition to
an existing log. Session: Claude Code, this repo's PR #4 investigation
thread, 22 September 2026.

## The headline: it doesn't reproduce

**Events.** Claude's environment has no browser MCP, so it drove the harness
directly with Playwright 1.56.1 plus Chromium: full console capture and an
independently timed page.evaluate poll. The M runner is green and fast: all
90 assertions passed, A:17 B:19 C:18 D:18 S:18, in 16.6s of a 900s budget,
zero page errors. Heartbeats instrumented via route interception (the repo
file never touched, tree hash unchanged): last heartbeat is row S18, run
completes. C alone in a fresh process: 18/18 in 3.5s. Four full matrix runs
in one browser process, twenty boots: 16.7s, 16.6s, 18.9s, 17.7s, 90/90 every
time. Neither hypothesis survived: not deterministic in C's content, does not
follow boot count. Only failing request anywhere is the Google Fonts webfont
(proxy cert), already named in CLAUDE.md as the app's one third-party call.

**Leading hypothesis from Claude.** The harness's own timing model is the
suspect: sleep() runs off a Worker clock with a silent setTimeout fallback,
and Chrome's intensive throttling after ~5 minutes hidden clamps chained
timers to roughly one per minute. A and B pass, then C crawls forever, with
the renderer alive and the console buffer readable the whole time. That
matches every symptom from the wedged pane, including the one that looked
most like a freeze. Falsification is two evaluates in the problem pane:
document.visibilityState (want "visible") and constructing a Worker from a
Blob URL (want truthy). Read the runner's self-reported budget, not wall
clock; the backgrounded-tab wall-clock lie is already recorded in CLAUDE.md.

**Commentary.** This collapses the suspect pool from "latent pre-rebase
regression" to "environmental, in the pane where M was originally run." The
tree is likely sound; nothing in the nine upstream commits or the v6.3
helmet is implicated by any evidence so far. Claude's interception-over-edit
choice deserves to become the standing technique: same information, zero
hash drift, nothing to keep out of a commit. Open threads: the two-evaluate
falsification in the original pane, and the G and H phases (focus- and
GPU-dependent by CLAUDE.md's own note), which Claude offers to run on the
local server at :8099 once it is restarted (it has since gone down; it does
not persist between turns in this environment).
