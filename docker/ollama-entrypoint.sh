#!/bin/sh
# Starts the Ollama server and pulls the configured models on first run (FR-01.2).
set -e
ollama serve &
pid=$!
until ollama list >/dev/null 2>&1; do sleep 1; done
for m in "$LLM_MODEL" "$LLM_VISION_MODEL"; do
  [ -n "$m" ] && ollama pull "$m"
done
wait "$pid"
