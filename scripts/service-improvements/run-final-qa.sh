#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="$ROOT_DIR/apps/docs/service-improvements/15-final-build-route-smoke-qa"
REPORT_FILE="$REPORT_DIR/FINAL_QA_REPORT.md"
PYTHON_BIN="${PYTHON_BIN:-python3}"

mkdir -p "$REPORT_DIR"

{
  echo "# Final QA Report"
  echo
  echo "- Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo "- Root: $ROOT_DIR"
  echo "- Docs root: apps/docs"
  echo
  echo "## Frontend clean build"
} > "$REPORT_FILE"

echo "[1/2] Frontend clean build"
(
  cd "$ROOT_DIR/apps/web"
  rm -rf .next
  npm run build
) 2>&1 | tee "$REPORT_DIR/frontend-build.log"

{
  echo
  echo '```text'
  tail -n 80 "$REPORT_DIR/frontend-build.log" || true
  echo '```'
  echo
  echo "## Backend compile"
} >> "$REPORT_FILE"

echo "[2/2] Backend compile"
(
  cd "$ROOT_DIR/apps/api"
  "$PYTHON_BIN" -m compileall app
) 2>&1 | tee "$REPORT_DIR/backend-compile.log"

{
  echo
  echo '```text'
  tail -n 80 "$REPORT_DIR/backend-compile.log" || true
  echo '```'
  echo
  echo "## Manual route smoke checklist"
  echo
  echo "Use apps/docs/service-improvements/15-final-build-route-smoke-qa/QA_ROUTE_SMOKE_MATRIX.md and apps/docs/control-center/data/routes.json for manual route checks."
  echo
  echo "## Decision"
  echo
  echo "Build checks passed. Manual route smoke remains pending."
} >> "$REPORT_FILE"

echo "Final QA report written to $REPORT_FILE"
