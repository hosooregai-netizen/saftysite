#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIR="$ROOT_DIR/apps/docs/service-improvements/16-rc-manual-qa-blocker-tracking"

mkdir -p "$DIR"

cp "$DIR/ROUTE_SMOKE_RESULTS_TEMPLATE.md" "$DIR/ROUTE_SMOKE_RESULTS.md"
cp "$DIR/BLOCKER_TRACKER_TEMPLATE.md" "$DIR/BLOCKER_TRACKER.md"
cp "$DIR/RELEASE_DECISION_TEMPLATE.md" "$DIR/RELEASE_DECISION.md"

{
  echo "# RC QA Report"
  echo
  echo "- Created at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo "- Applied package: feature-by-feature service improvements"
  echo "- Docs root: apps/docs"
  echo
  echo "## Build logs"
  echo
  echo "- Frontend: apps/docs/service-improvements/15-final-build-route-smoke-qa/frontend-build.log"
  echo "- Backend: apps/docs/service-improvements/15-final-build-route-smoke-qa/backend-compile.log"
  echo
  echo "## Manual QA files"
  echo
  echo "- ROUTE_SMOKE_RESULTS.md"
  echo "- BLOCKER_TRACKER.md"
  echo "- RELEASE_DECISION.md"
} > "$DIR/RC_QA_REPORT.md"

echo "Created:"
echo "$DIR/RC_QA_REPORT.md"
echo "$DIR/ROUTE_SMOKE_RESULTS.md"
echo "$DIR/BLOCKER_TRACKER.md"
echo "$DIR/RELEASE_DECISION.md"
