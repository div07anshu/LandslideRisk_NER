#!/bin/bash

# Automated District Risk Fetcher
# This script runs the background fetcher and schedules it to run every 3 hours

cd "$(dirname "$0")"

VENV_PATH="ai_services/venv/bin/activate"
FETCHER_SCRIPT="ai_services/fetch_all_districts.py"
LOG_FILE="cache/fetch_log.txt"

# Ensure log directory exists
mkdir -p cache

echo "======================================" >> "$LOG_FILE"
echo "Starting fetch at $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

# Activate virtual environment and run fetcher
if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    python "$FETCHER_SCRIPT" >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Fetch completed successfully at $(date)" >> "$LOG_FILE"
    else
        echo "❌ Fetch failed with exit code $EXIT_CODE at $(date)" >> "$LOG_FILE"
    fi
else
    echo "❌ Virtual environment not found at $VENV_PATH" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
