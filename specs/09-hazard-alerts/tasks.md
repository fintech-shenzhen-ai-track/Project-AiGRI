# 09 Hazards, Loss Events and alerts: tasks

Depends on 02 (quarantined reader), 06 (assets, capture sessions), 07 (forecast snapshots, risk outputs).

## Phase A: contracts

- [ ] **T-09.01** Migration `0009` and endpoints with stubs; OpenAPI regenerated.
- [ ] **T-09.02** `HazardWarning` quarantined schema and the step-library format.

## Phase B: feeds and events

- [ ] **T-09.03** Confirm BMKG access (structured feed, terms, rate) and record the finding in `decisions.md` (D-27). Then implement `feeds/bmkg.py`. FR-09.2.
- [ ] **T-09.04** [P] GDACS client and parser. FR-09.1.
- [ ] **T-09.05** Loss Event creation and status, asset matching in PostGIS. FR-09.4.
- [ ] **T-09.06** Alert rule with dedupe and level escalation. FR-09.5. Test first.
- [ ] **T-09.07** Alert content builder with steps and deadline rules (rules engine). FR-09.6.
- [ ] **T-09.08** [P] Notifications: push (VAPID), SMS and email mocks, delivery statuses. FR-09.7.
- [ ] **T-09.09** Before-photo capture sessions from alerts. FR-09.8.
- [ ] **T-09.10** Affected prompt and Client loss reports. FR-09.9.

## Phase C: UI

- [ ] **T-09.11** c09 Home aggregate endpoint and page. FR-09.10, US-09.5.
- [ ] **T-09.12** c10 alert page and alerts list. US-09.1–US-09.3.
- [ ] **T-09.13** [P] Sandbox story-jump banner. FR-09.11.

## Phase D: bench

- [ ] **T-09.14** Backtest harness: replay Demak Feb 2024 and Mar 2024 warnings and flood maps on synthetic farms; report assets alerted, lead time and on-time claims. Bench suite "Historical backtests".
