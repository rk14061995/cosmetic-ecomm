#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -d e2e/.venv ]]; then
  python3 -m venv e2e/.venv
fi
e2e/.venv/bin/pip install -q -r e2e/requirements.txt
exec e2e/.venv/bin/python -m pytest e2e -v "$@"
