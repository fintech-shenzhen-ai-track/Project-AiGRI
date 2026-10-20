# 02 Gateway and agent runtime: tasks

## Phase A: contracts

- [x] **T-02.01** `gateway.registry` and `Tool` model; registry loader; empty `tools.py` stubs in every module folder with the tool names and tiers from `tools-and-tiers.md`. FR-02.1. Done when: the parity test passes.
- [x] **T-02.02** `gateway.tags` (`Tagged[T]`, origins, propagation, readers). FR-02.6. Test first with property tests.
- [x] **T-02.03** `gate(...)` FastAPI dependency and the router-graph test. FR-02.2, US-02.1. Done when: a deliberately ungated test route makes the test fail.

## Phase B: enforcement

- [ ] **T-02.04** `authorize()` with role, tenant, tag and tier checks and `gateway.denied` logging. FR-02.2, FR-02.3. Test first.
- [ ] **T-02.05** `confirm_tier2()` consent gate. FR-02.4. Done when: correct hash passes; changed packet, stale hash, wrong user, wrong state each fail with the right code and audit entry.
- [ ] **T-02.06** Code-only trigger check. FR-02.5. Done when: `wallet.post_payout` without a `claim.approved` seq for the same claim is refused.
- [ ] **T-02.07** [P] Tag policies table from plan; tests per policy.

## Phase C: model runtime

- [ ] **T-02.08** Provider protocol and Ollama adapter with schema `format`, temperature 0, `think: false`, validation and one retry. FR-02.7. Done when: an integration test against the compose `ollama` service fills a small schema with `qwen3:8b`.
- [ ] **T-02.09** [P] Hosted adapter skeleton behind the same protocol, refusing to start unless the configured provider declares schema enforcement. FR-02.7, D-10.
- [ ] **T-02.10** Quarantined reader for text, PDF pages and images (vision model). FR-02.8. Done when: an injected-instruction fixture returns only schema fields and an extra-field reply is rejected.
- [ ] **T-02.11** Planner with plan templates and execution through the gateway. FR-02.9.
- [ ] **T-02.12** [P] Drafting tool (Tier 1) with versioned prompt templates. FR-02.10.
- [ ] **T-02.13** `agent.call` logging. FR-02.11.
- [ ] **T-02.14** [P] Kill switch. FR-02.12.

## Phase D: bench

- [ ] **T-02.15** Red-team cases ASI01, ASI02, ASI03, ASI07, ASI10 in `bench/suites/red_team/cases/` and the `SECURITY_DEFENCES=off` path guarded by startup checks.
