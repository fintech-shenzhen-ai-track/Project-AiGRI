# 18 Submission deliverables: spec

## Summary

The competition asks for technical documentation, a presentation deck (≤ 10 min), an optional demo video (≤ 5 min), source code with README, GitHub link, deployment instructions and test cases, a security self-assessment (permission-tier implementation and known-risk list), and execution evidence (sandbox operation logs and demo video). This feature produces the code-side deliverables from the running system so they never drift from it.

## Requirements

- **FR-18.1** `README.md` (repo root): what AiGRI is (two paragraphs), quick start (`make up`, `make seed`), hardware (qwen3:14b wants a GPU with about 12 GB VRAM; qwen3:8b about 8 GB; CPU-only works but is slow; qwen3-vl:8b for images; Ollama ≥ 0.12.7), `.env` keys including the hosted-fallback rule (must enforce JSON schemas), demo accounts, checkpoints, `make bench`, licence notes for data sources (Open-Meteo CC BY 4.0, Copernicus data terms, GDACS indicative-data notice).
- **FR-18.2** `docs/architecture.md`: the architecture diagram (trust boundary and gateway), module map, data flow per hero step, lifecycles from `specs/00-shared/events.md`, and the core algorithms (Risk Model, Curation formula with the worked example, rules engine, Damage Assessment pipeline) with links to code.
- **FR-18.3** `docs/security-self-assessment.md`: generated in part from code: the permission-tier table rendered from the live gateway registry (and diffed against `tools-and-tiers.md`), capability tags and policies, tenant isolation design and the latest RLS test result, consent hashing, Audit Log chain design and the latest verification, the known-risk list mapped to OWASP ASI01–ASI10 with mitigation and red-team test, and the latest red-team before/after numbers from a bench run (measured only).
- **FR-18.4** `docs/deployment.md`: Docker Compose topology, environment, model pulls, MinIO, backups, production requirements not built (licensed e-money partner per market, real SMS/email, BMKG/GFM credentials), and the data-source access checks to repeat before launch.
- **FR-18.5** `docs/execution-evidence/`: the committed sample bench results folder (ops logs + Audit Log export + chain file) and instructions to verify it.
- **FR-18.6** Demo video script `docs/demo-script.md` following the hero story checkpoints, timed to ≤ 5 minutes; the team records it from the running sandbox.
- **FR-18.7** Every number in the docs either comes from a bench run (with its run id) or is labelled as demo data; the PCIC denied-claims study stays labelled "placeholder" until the team supplies its link.

## Tasks

- [ ] **T-18.01** README. FR-18.1.
- [ ] **T-18.02** Architecture doc with diagrams (Mermaid or SVG committed). FR-18.2.
- [ ] **T-18.03** Security self-assessment generator script and document. FR-18.3.
- [ ] **T-18.04** Deployment doc. FR-18.4.
- [ ] **T-18.05** Execution evidence folder and verification instructions. FR-18.5.
- [ ] **T-18.06** Demo script. FR-18.6.
- [ ] **T-18.07** Final consistency pass against FR-18.7.
