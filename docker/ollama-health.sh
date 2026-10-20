#!/bin/sh
# Healthy only when both configured models are present.
out=$(ollama list) || exit 1
for m in "$LLM_MODEL" "$LLM_VISION_MODEL"; do
  echo "$out" | grep -q "^$m" || exit 1
done
