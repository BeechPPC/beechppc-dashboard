#!/bin/bash
# Wrapper script that ensures dependencies are installed before running analysis

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"
PYTHON="$VENV_DIR/bin/python3"

# Check if venv exists
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Setting up virtual environment..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install -q -r "$SCRIPT_DIR/requirements.txt"
    echo "✅ Environment ready"
fi

# Run the analysis with all arguments passed through
"$PYTHON" "$SCRIPT_DIR/analyze.py" "$@"
