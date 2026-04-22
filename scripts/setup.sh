#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROJECT_DIR=${1:-"."}
LOG_FILE=${2:-"setup.log"}

if [ "$PROJECT_DIR" = "." ] || [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR="$SCRIPT_DIR"
elif [[ "$PROJECT_DIR" != /* ]]; then
    PROJECT_DIR="$SCRIPT_DIR/$PROJECT_DIR"
fi

PROJECT_DIR=$(realpath "$PROJECT_DIR")
LOG_FILE="$PROJECT_DIR/$LOG_FILE"

log() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S.%3N')
    entry="$timestamp | $1"
    echo "$entry" | tee -a "$LOG_FILE"
}

log "Starting setup script"
log "Script location: $SCRIPT_DIR"
log "Project directory: $PROJECT_DIR"
log "Log file: $LOG_FILE"

if ! command -v python3 &> /dev/null; then
    log "ERROR: python3 not found"
    exit 1
fi

log "Python found: $(python3 --version)"

VENV_PATH="$PROJECT_DIR/venv"
log "Creating virtual environment at $VENV_PATH"
python3 -m venv "$VENV_PATH" 2>&1 | tee -a "$LOG_FILE"

log "Activating virtual environment"
source "$VENV_PATH/bin/activate"

REQ_FILE="$PROJECT_DIR/requirements.txt"

if [ -f "$REQ_FILE" ]; then
    log "Installing dependencies from requirements.txt"
    pip install -r "$REQ_FILE" 2>&1 | tee -a "$LOG_FILE"
else
    log "ERROR: requirements.txt not found"
    log "Run pip install manually"
    exit 1
fi

log "Setup completed"
