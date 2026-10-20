# 02 Gateway and agent runtime: plan

## Owns

`backend/aigri/gateway/`, `backend/aigri/agent/`, migration `0002_*` (none expected; uses core tables).

## Module layout

```
gateway/
  registry.py      Tool dataclass, register(), load_all() imports <module>/tools.py
  tags.py          Tagged[T], Origin enum and parser, propagation, readers
  policies.py      argument policies (untrusted_forbidden_for, must_originate_from, ...)
  authorize.py     authorize(), confirm_tier2(), check_trigger()
  errors.py        GatewayDenied(reason_code)
  testing.py       helpers to assert a route is gated
agent/
  provider/
    base.py        LLMProvider protocol: complete_json, complete_text
    ollama.py      HTTP client to /api/chat with format=schema, options.temperature=0, think=false
    hosted.py      adapter for a provider that enforces JSON schema (configured later)
  quarantine.py    read(content: bytes|str|image, schema: type[BaseModel], instruction_key) -> Tagged[Model]
  planner.py       plan(request: TrustedRequest) -> Plan; execute(plan) via gateway
  drafting.py      draft_text(template_key, typed_fields) -> Draft (Tier 1)
  prompts/         versioned prompt templates (.md with front matter: version, schema)
  schemas/         Pydantic models used as quarantined targets (policy record parts, tag read, vet certificate, hazard advisory)
```

## Gateway algorithm

```
authorize(tool_name, actor, args):
  tool = registry.get(tool_name) or deny("unknown_tool")
  if actor.kind == "agent" and not tool.agent_allowed: deny("not_registered_for_agent")
  if actor.kind == "person" and actor.role not in tool.roles: deny("role")
  if actor.kind == "code": require tool.code_allowed and check_trigger(tool, args.trigger_seq)
  for each object reference in args: load tenant; if mismatch: deny("tenant")   # 404 to the user
  for each arg: policies.check(tool, arg_name, arg.origin) or deny("capability_tag")
  if tool.tier == 2: require confirm_tier2 already passed in this request
  audit.append(action=tool.audit_action, tier=tool.tier, actor, object, payload=summarised args)
  return Authorized(tool, actor)
```

Routes call it via a FastAPI dependency `Depends(gate("claim.decide"))`, which also provides the authorized context to the service. The router-graph test inspects every APIRoute's dependants for a `gate(...)` dependency.

## Quarantined reader

- Input: bytes or text plus a target Pydantic model with `model_config = ConfigDict(extra="forbid")`.
- Prompt: a fixed instruction per target ("Fill this JSON schema from the document. Copy clause ids exactly. Leave a field empty if the document does not state it.") + the JSON schema text + the content inside clear delimiters. No other context.
- Output validated with the model. On failure: one retry with the validation error appended; then `QuarantineError`.
- Output values get origin `untrusted:<kind>:<id>`.
- PDF text extraction happens before the model with a permissive-licence library (`pdfplumber` or `pypdf`; avoid AGPL libraries), keeping page numbers and character offsets for clause spans and character colours for the hidden-text scan (feature 04).
- Images go to `LLM_VISION_MODEL` (D-10).

## Planner

v2 plans are short and mostly deterministic. The planner is a model call that chooses among a small set of plan templates for a trusted request, then fills arguments with handles. Templates:

| Request | Plan |
| --- | --- |
| Client asks a policy question | `policy.answer_question(record_id, question=user:...)` |
| Loss Event touches covered assets and Client says "affected" | `damage.assess` per asset → `claim.draft_packet` |
| Claim submitted | `claim.precheck` → `rules.propose_amount` |
| Claim denied | `claim.draft_appeal` |
| Adjuster clicks "Request more information" | `claim.draft_info_request` |
| Superadmin clicks "Draft nudge" | `nudge.draft` |
| Policy PDF uploaded | `policy.compile` |

Because most plans are fixed, the planner may be implemented as code that selects a template, using the model only to classify free-text Client questions. That still satisfies the pattern: the model never sees untrusted text, and nothing it outputs can name a Tier 2 or 3 tool.

## Tag policies (initial set)

| Policy | Applied to |
| --- | --- |
| `untrusted_forbidden` | every argument named `tool`, `recipient`, `insurer_id`, `client_id`, `role`, `amount*`, `weight*`, `url`, `path`, `rank*` |
| `must_be_published_record_or_risk` | every Curation input |
| `must_be_rules_user_or_system` | amounts in `claim.decide`, `wallet.*`, `purchase.confirm` |
| `readers_include_actor` | every read |

## Defence toggle for the bench

`SECURITY_DEFENCES=off` (only when `SANDBOX=true` and `BENCH_RUN=1`) disables tag policies and the quarantine boundary (the planner receives raw text) so the red-team suite can measure attack success before and after. It can never be set in a normal run (startup check).

## Tests

- Registry vs `tools-and-tiers.md` parity.
- Property tests: random actors × tools × tags never authorize a forbidden combination.
- Router-graph test.
- Quarantine: schema with `extra="forbid"` rejects smuggled fields; a prompt-injection PDF fixture yields only schema fields.
