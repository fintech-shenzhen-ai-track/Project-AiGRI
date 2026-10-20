# Tools, tiers and capability tags

Every action in AiGRI is a named tool in the gateway registry, whether the agent, a person (through the API) or code (a worker) calls it. This table is the security self-assessment's permission-tier implementation, so it must match the code exactly. Feature 02 builds the registry; each feature registers its own tools in `<module>/tools.py` with exactly these names and tiers. A test (`tests/gateway/test_registry_matches_spec.py`) parses this file and fails on any difference.

## Callers

- `agent`: the planner. It can call only tools whose "Agent" column is "yes".
- `person:<role>`: a signed-in user through the API.
- `code`: a worker or outbox consumer acting on a recorded event. It can call only tools whose "Code" column is "yes", and must pass the triggering Audit Log `seq`.

## Registry

| Tool | Tier | Agent | Person roles | Code | Notes |
| --- | --- | --- | --- | --- | --- |
| `client.read` | 0 | — | client_owner | — | Every Client read route; tenant enforced by RLS |
| `insurer.read` | 0 | — | product_manager, underwriter_adjuster, finance | — | Every Insurer read route; tenant enforced by RLS |
| `admin.read` | 0 | — | superadmin | — | Every Superadmin read route; reads of client personal data also write `admin.viewed` |
| `capture.read_session` | 0 | — | token holder | — | Capture Page session lookup by one-time token |
| `policy.answer_question` | 0 | yes | client_owner, any insurer role | — | Clause-cited answer or abstain (04) |
| `policy.compile` | 0 | yes (quarantined) | — | yes | Runs on upload; output is a draft record (04) |
| `reader.extract` | 0 | yes (quarantined) | — | yes | Generic quarantined extraction into a named schema (02) |
| `risk.compute` | 0 | yes | — | yes | (07) |
| `curation.run` | 0 | yes | client_owner (view) | yes | (07) |
| `hazard.ingest` | 0 | — | — | yes | (09) |
| `alert.send` | 0 | yes | — | yes | Template messages only (09) |
| `damage.assess` | 0 | yes | — | yes | (10) |
| `claim.precheck` | 0 | yes | — | yes | Writes drafts only (11) |
| `rules.propose_amount` | 0 | yes | underwriter_adjuster (view) | yes | Deterministic; output is a proposal (05, 11) |
| `anomaly.flag` | 0 | yes | — | yes | Ranking or audit anomalies for the Superadmin (14) |
| `purchase.draft` | 1 | yes | client_owner | — | (08) |
| `claim.draft_packet` | 1 | yes | client_owner | yes | (11) |
| `claim.draft_appeal` | 1 | yes | client_owner | yes | Automatic on denial (D-18) |
| `claim.draft_info_request` | 1 | yes | underwriter_adjuster | — | Text the Adjuster edits and sends (11) |
| `nudge.draft` | 1 | yes | superadmin | — | Free-text Nudge draft (14) |
| `purchase.confirm` | 2 | no | client_owner | — | Needs matching packet hash (08) |
| `claim.submit` | 2 | no | client_owner | — | Needs matching packet hash; also used for resubmissions and appeals (11) |
| `consent.share_with_insurer` | 2 | no | client_owner | — | Part of `purchase.confirm`; listed for the self-assessment |
| `evidence.capture` | 3 | no | client_owner | — | Capture Page upload; the agent never creates evidence |
| `asset.edit` | 3 | no | client_owner | — | Parcels, livestock groups, Ear Tags (06). The agent may suggest values as a Tier 1 draft through `asset.draft_edit` |
| `asset.draft_edit` | 1 | yes | — | — | (06) |
| `loss.report` | 3 | no | client_owner | — | Client reports a loss or answers "Was your farm affected?" (09) |
| `notifications.subscribe` | 3 | no | any signed-in role | — | Web Push subscription and channel settings (03, 09) |
| `nudge.mark_seen` | 3 | no | product_manager, underwriter_adjuster, finance | — | (13) |
| `policy_record.upload` | 3 | no | product_manager | — | (04) |
| `policy_record.review_field` | 3 | no | product_manager | — | (04) |
| `policy_record.set_limits` | 3 | no | product_manager | — | (04) |
| `policy_record.publish` | 3 | no | product_manager | — | (04) |
| `policy_record.hold` | 3 | no | superadmin | — | (14) |
| `underwriting.decide` | 3 | no | underwriter_adjuster | — | (08) |
| `claim.start_review` | 3 | no | underwriter_adjuster | — | (11) |
| `claim.request_info` | 3 | no | underwriter_adjuster | — | Sends the message (11) |
| `claim.decide` | 3 | no | underwriter_adjuster | — | Approve or deny, final amount, reasons (11) |
| `wallet.top_up` | 3 | no | client_owner | — | Sandbox top-up (12) |
| `wallet.fund` | 3 | no | finance | — | Insurer pre-funding (12) |
| `wallet.withdraw` | 3 | no | client_owner | — | (12) |
| `payout_account.change` | 3 | no | client_owner, finance | — | OTP required (D-19) |
| `wallet.post_premium` | 3 | no | — | yes | Trigger: `purchase.confirmed` seq |
| `wallet.release_escrow` | 3 | no | — | yes | Trigger: `policy.issued` seq |
| `wallet.post_refund` | 3 | no | — | yes | Trigger: `purchase.declined` seq |
| `wallet.post_payout` | 3 | no | — | yes | Trigger: `claim.approved` seq; idempotent per claim |
| `nudge.send` | 3 | no | superadmin | yes (rule Nudges only) | (14) |
| `nudge.set_rule` | 3 | no | superadmin | — | Enable a rule or set its threshold (14, D-21) |
| `insurer.create` | 3 | no | superadmin | — | (14) |
| `insurer.complete_step` | 3 | no | superadmin | — | (14) |
| `insurer.go_live` | 3 | no | superadmin | — | (14) |
| `membership.grant` | 3 | no | superadmin | — | (14, D-20) |
| `membership.revoke` | 3 | no | superadmin | — | (14) |
| `dispute.open` | 3 | no | client_owner | — | (14) |
| `dispute.resolve` | 3 | no | superadmin | — | Records an outcome; never changes a claim decision |
| `audit.verify_chain` | 0 | no | superadmin | yes | (14) |
| `ranking.audit` | 0 | no | superadmin | yes | Replays a sample of Curation runs (14) |
| `clock.move` | 3 | no | superadmin (sandbox only) | yes (demo scripts) | Disabled when `SANDBOX=false` (15) |

"no" in the Agent column means the tool is not registered for the agent at all, so the planner cannot even name it. A planner output that names an unknown or unregistered tool is rejected and logged as `gateway.denied` (red-team test ASI10).

Routes exempt from `gate(...)`, listed so the router-graph test can allow exactly these: `GET /api/v1/health`, `GET /api/v1/packs*`, the `/api/v1/auth/*` routes (they establish or end the session; they still write `auth.*` Audit Log entries), and the sandbox-only `/api/v1/dev/*` routes (which check `SANDBOX` and `DEV_TOKEN` themselves). Every other route names one tool from this table; read routes use `client.read`, `insurer.read` or `admin.read`.

## Capability tags

Every value the planner or a tool handles is wrapped as `Tagged[T] = {value, origin, readers}`.

| Origin tag | Meaning |
| --- | --- |
| `user:<user_id>` | Typed by the signed-in person in this request |
| `record:<record_id>@<version>` | From a published Policy Record field (reviewed by a person) |
| `rules_engine:<version>` | Computed by the rules engine |
| `risk_model:<version>` | Computed by the Risk Model |
| `pipeline:<name>@<version>` | Computed by Damage Assessment or hazard parsers |
| `system` | Platform data (ids, timestamps, statuses) |
| `untrusted:insurer_pdf:<insurer_id>` | Quarantined extraction from an insurer PDF, before review |
| `untrusted:photo:<file_id>` | Quarantined reading of a photo (tag number, scene description) |
| `untrusted:document:<file_id>` | Letters, vet certificates |
| `untrusted:hazard_text:<source>` | Advisory and bulletin text |

Policy functions (checked by the gateway before each call):

1. An `untrusted:*` value may never be: a tool name, a recipient, an amount, a ranking input, an insurer id, a client id, a role, a URL, or a file path. It may fill a display field or a review suggestion.
2. Amounts passed to `claim.decide`, `wallet.*` and `purchase.confirm` must carry `rules_engine`, `record`, `user` (the deciding person) or `system` origin.
3. Curation inputs must carry `record` (published only) or `risk_model` origin.
4. A value's `readers` set limits who may see it: data from an insurer's draft record is readable only by that insurer's staff and the Superadmin; client asset data is readable by an insurer only after a covering Policy exists (enforced again by RLS).
5. The quarantined reader's output passes JSON-schema validation or is dropped whole. Extra properties are rejected (`additionalProperties: false`), so free text cannot ride along (red-team test ASI07).
