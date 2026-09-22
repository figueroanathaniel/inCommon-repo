#!/bin/bash
set -uo pipefail

# Fast smoke check for Claude Code on the web sessions on this repo.
# inCommon is buildless (no package.json/node_modules/Jest - see CLAUDE.md),
# so this runs two of the plain-node verification gates directly rather than
# installing anything: run-tests-node.js (pure test suite against the core
# module + fixtures) and check-layer-boundary.js (mechanics/interpretation
# dependency check). Both run in well under a second. The full 19-gate,
# 25+ minute suite is intentionally not run here.

cd "$CLAUDE_PROJECT_DIR" || exit 0

fail=0
msg=""

if ! out=$(node tools/run-tests-node.js 2>&1); then
  fail=1
  failing=$(printf '%s' "$out" | node -e '
    let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
      try{const j=JSON.parse(d);const bad=(j.assertions||[]).filter(a=>!a.pass).map(a=>a.id);
      console.log(bad.slice(0,8).join(", "));}catch(e){console.log("(unparseable output)");}
    })')
  msg="${msg}run-tests-node.js: FAILING assertions: ${failing}. "
fi

if ! out2=$(node tools/check-layer-boundary.js 2>&1); then
  fail=1
  msg="${msg}check-layer-boundary.js failed: $(printf '%s' "$out2" | tail -5 | tr '\n' ' ')"
fi

if [ "$fail" -ne 0 ]; then
  node -e '
    const msg = process.argv[1];
    console.log(JSON.stringify({
      systemMessage: "SessionStart smoke check FAILED: " + msg,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: "Startup smoke check (tools/run-tests-node.js + tools/check-layer-boundary.js) failed before any work began: " + msg + " This indicates the environment or a prior change broke something already, independent of any new work in this session."
      }
    }));
  ' "$msg"
else
  echo '{"systemMessage": "Startup smoke check passed (run-tests-node.js + check-layer-boundary.js)."}'
fi

exit 0
