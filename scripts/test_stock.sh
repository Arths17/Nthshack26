#!/usr/bin/env bash
# Quick test script to validate the stock endpoint locally.
# Usage:
# 1. Start the backend: `uvicorn backend.server:app --reload --port 8000`
# 2. Run this script: `./scripts/test_stock.sh NVDA` (default symbol NVDA)

set -euo pipefail
SYMBOL=${1:-NVDA}
TIMEFRAME=${2:-3M}

URL="http://localhost:8000/api/py/stock/${SYMBOL}?timeframe=${TIMEFRAME}"

echo "Testing stock endpoint: ${URL}"
echo
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -H "Accept: application/json" "${URL}" | sed -n '1,200p'
