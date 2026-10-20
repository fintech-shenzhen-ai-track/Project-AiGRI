# 14 Superadmin and Nudges: tasks

Depends on 04 (records, findings), 07 (replay), 11 (claims and SLA), 12 (wallet integrity), 01 (audit verify).

## Phase A: contracts

- [ ] **T-14.01** Migration `0014` and admin views; endpoints and models with stubs; OpenAPI regenerated.

## Phase B: backend

- [ ] **T-14.02** Nudge rules, scheduler (09:00 pack time), once-per-condition dedupe, automatic send and dashboard delivery. FR-14.6. Test first with the PLAN dates (1 Mar 2026 09:00 WIB fires for CLM-26-000402 and PR-ACA-RMP-2026).
- [ ] **T-14.03** Free-text Nudge drafting and sending. FR-14.7.
- [ ] **T-14.04** [P] Disputes (open from client, list, remind, resolve). FR-14.8.
- [ ] **T-14.05** [P] Insurer onboarding steps, go-live guard, role grants (D-20). FR-14.3.
- [ ] **T-14.06** [P] System health writers and endpoint. FR-14.2.
- [ ] **T-14.07** Ranking audit job (sample replay, schema scan, anomaly flags). FR-14.5.
- [ ] **T-14.08** [P] Overview aggregates and SLA by insurer. FR-14.1.
- [ ] **T-14.09** [P] Audit log query, event detail and verify. FR-14.10.

## Phase C: UI

- [ ] **T-14.10** a01 overview. US-14.1.
- [ ] **T-14.11** a02 insurers and verification, plus staff roles sheet (D-14). US-14.2.
- [ ] **T-14.12** a03 policy quality. US-14.3.
- [ ] **T-14.13** a04 disputes and SLAs with the Nudge composer. US-14.4.
- [ ] **T-14.14** a05 country packs. US-14.5.
- [ ] **T-14.15** a06 audit log. US-14.6.

## Phase D: bench

- [ ] **T-14.16** Ranking-audit determinism check in the Curation suite; red-team Superadmin overreach cases.
