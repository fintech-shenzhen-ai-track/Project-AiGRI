.PHONY: up down seed demo-reset test e2e lint openapi bench help

UV ?= uv
BACKEND := backend
PORTALS := portals
HAS_PNPM := $(shell command -v pnpm >/dev/null 2>&1 && echo yes)
# The frontend half of lint/test/openapi runs once feature 03 adds a real package (with a lint script).
HAS_FRONTEND := $(shell [ -d $(PORTALS)/node_modules ] && echo yes)

help:
	@echo "targets: up down seed demo-reset test e2e lint openapi bench"

.env:
	cp .env.example .env

up: .env
	docker compose up --build -d --wait

down:
	docker compose down

# seed and demo-reset are implemented by feature 15 (seed/ and scripts/demo/).
seed:
	@if [ -f seed/load.py ]; then cd $(BACKEND) && $(UV) run python ../seed/load.py; \
	else echo "seed: no fixtures yet (feature 15)"; fi

demo-reset:
	@if [ -f scripts/demo/reset.sh ]; then sh scripts/demo/reset.sh; \
	else echo "demo-reset: not implemented yet (feature 15)"; fi

test:
	cd $(BACKEND) && $(UV) run pytest -q
	@if [ -n "$(HAS_PNPM)" ] && [ -n "$(HAS_FRONTEND)" ]; then cd $(PORTALS) && pnpm test; \
	else echo "frontend tests skipped: pnpm or portals/node_modules missing"; fi

e2e:
	@if [ -n "$(HAS_PNPM)" ] && [ -n "$(HAS_FRONTEND)" ]; then cd $(PORTALS) && pnpm exec playwright test; \
	else echo "e2e skipped: pnpm or portals/node_modules missing (feature 03 adds Playwright)"; fi

lint:
	cd $(BACKEND) && $(UV) run ruff check .
	cd $(BACKEND) && $(UV) run ruff format --check .
	cd $(BACKEND) && $(UV) run mypy aigri
	@if [ -n "$(HAS_PNPM)" ] && [ -n "$(HAS_FRONTEND)" ]; then \
	  cd $(PORTALS) && pnpm exec eslint . && pnpm exec tsc --noEmit && node scripts/design-lint.mjs; \
	else echo "frontend lint skipped: pnpm or portals/node_modules missing"; fi

openapi:
	cd $(BACKEND) && PYTHONPATH=. $(UV) run python scripts/export_openapi.py openapi.json
	@if [ -n "$(HAS_PNPM)" ] && [ -n "$(HAS_FRONTEND)" ]; then \
	  cd $(PORTALS) && pnpm exec openapi-typescript ../$(BACKEND)/openapi.json -o lib/api/types.ts; \
	else echo "portals/lib/api/types.ts not regenerated: pnpm or openapi-typescript missing"; fi

# AiGRI-Bench is built by feature 16.
bench:
	@if [ -f bench/run.py ]; then cd $(BACKEND) && $(UV) run python ../bench/run.py; \
	else echo "bench: no suites yet (feature 16)"; fi
