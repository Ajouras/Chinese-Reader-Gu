#!/usr/bin/env bash

# Cross-platform startup script for macOS, Linux, and WSL
set -e

PORT=3000
URL="http://localhost:${PORT}"

echo "========================================="
echo "   Starting Chinese Reader GU..."
echo "========================================="

# Helper function to open browser in background once server responds
open_browser() {
  echo "Waiting for local server on port ${PORT}..."
  
  # Wait for port 3000 to become available (polling up to 30 seconds)
  for i in {1..30}; do
    if command -v curl >/dev/null 2>&1; then
      if curl -s -o /dev/null -w "%{http_code}" "${URL}" 2>/dev/null | grep -E '200|304|404' >/dev/null; then
        break
      fi
    elif command -v nc >/dev/null 2>&1; then
      if nc -z localhost ${PORT} 2>/dev/null; then
        break
      fi
    fi
    sleep 1
  done

  echo "Opening browser at ${URL}..."
  if command -v open >/dev/null 2>&1; then
    # macOS
    open "${URL}"
  elif command -v xdg-open >/dev/null 2>&1; then
    # Linux desktop
    xdg-open "${URL}"
  elif command -v wslview >/dev/null 2>&1; then
    # Windows Subsystem for Linux (WSL)
    wslview "${URL}"
  elif [ -n "$BROWSER" ]; then
    "$BROWSER" "${URL}"
  fi
}

# Run the browser opener in background
open_browser &

# Start the dev server
npm run dev
