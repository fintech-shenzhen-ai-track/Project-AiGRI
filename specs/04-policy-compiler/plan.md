# 04 Policy Compiler and Policy Q&A: plan

## Owns

`backend/aigri/compiler/`, routers `insurer_products.py` and `client_policy_qa.py`, migration `0004_*`, `portals/app/insurer/products/`, the clause sheet and Q&A component (`portals/components/PolicyQA/`, registered with 03).

## Pipeline

```
upload ─► store PDF ─► job: extract (pages, chars, colours) ─► segment clauses ─► injection scan
      ─► per-section quarantined extraction ─► assemble + schema validate ─► clause verification
      ─► self-check questions ─► ambiguity rules ─► confidence ─► status needs_review | ready
```

Sections and their target sub-models (each a Pydantic model with `extra="forbid"`):

| Section | Fields |
| --- | --- |
| identity | product_name, product_type, insured_class, scheme, eligibility |
| period and currency | period, currency |
| cover | perils_covered (with conditions), exclusions |
| money | sum_insured, deductible, premium, loss_categories |
| deadlines and documents | deadlines, documents_required |

The section prompt contains only the clauses whose headings match the section (plus their neighbours), never the whole document.

## Endpoints

| Method | Path | Tool | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/insurer/products/records` (multipart) | `policy_record.upload` | `202 {job_id, record_id}` |
| GET | `/api/v1/insurer/products/records` | read | list with status, confidence, flags, age |
| GET | `/api/v1/insurer/products/records/{id}` | read | body, field reviews, clauses index, findings, file meta |
| GET | `/api/v1/insurer/products/records/{id}/clauses/{clause_id}` | read | text, page, span |
| POST | `/api/v1/insurer/products/records/{id}/fields/{pointer}/review` | `policy_record.review_field` | `{action: accept|edit, value?, reason?}` |
| PUT | `/api/v1/insurer/products/records/{id}/limits` | `policy_record.set_limits` | issuance limits body |
| POST | `/api/v1/insurer/products/records/{id}/acknowledge-findings` | `policy_record.review_field` | |
| POST | `/api/v1/insurer/products/records/{id}/publish` | `policy_record.publish` | `409` with the list of blockers if not publishable |
| GET | `/api/v1/client/records/{record_key}` | read | latest published version, for c07 |
| GET | `/api/v1/client/records/{record_key}/clauses/{clause_id}` | read | clause sheet |
| POST | `/api/v1/client/records/{record_key}/ask` | `policy.answer_question` | `{question}` → `{answer, citations:[clause_id], abstained, record_version}` |

## Self-check question templates

Stored in `compiler/selfcheck/templates.yaml`, one or more per schema path, with an answer normaliser (`bool`, `int_days`, `pct`, `money_minor`, `enum`, `set`). Example: `/perils_covered[peril=drought]/conditions` → "Is drought covered without any condition?" normalised to `bool` + "What condition applies to drought cover?" normalised to `set` of condition kinds.

## i02 UI

Route `/insurer/products/[recordId]`. Layout `.split-r`: left sticky PDF card (clause text with cream highlight), right grouped read-only fields with `.cite` chips; flagged fields show `.pill-need` "Check" with Accept/Edit; the deductible scope uses two chips. Below: Issuance limits card, "Before you publish" check-list (every field cites a clause; flagged fields reviewed; limits set; injected-instruction scan result), then the single `.btn-y` "Publish to AiGRI", disabled with the blocker hint. Motion per PLAN i02. A list page `/insurer/products` shows records (Live, Draft, Needs review) using the Table component.

## Q&A UI

`PolicyQA` component on c07: the three "Common questions" (precomputed answers cached per record version) plus a question box. Answers render as text plus `.cite` chips; abstentions show the `.pill-pending` "Not stated in this policy". Answers never say "covered" without a cite.

## Tests

- Schema parity: Pydantic section models round-trip to `policy-record.schema.json`.
- Golden compile of the seeded Jasindo PDF reproduces PLAN 2.5 terms and flags exactly the drought condition and deductible scope.
- ACA PDF: injection finding on page 23; three self-check disagreements as in PLAN a03; confidence ≤ 0,85.
- Q&A gold set from the bench.
