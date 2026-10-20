# Data model

PostgreSQL 16 with PostGIS. One Alembic migration chain in `backend/migrations/`; each feature adds its own revision files for the tables it owns (owner column below). Geometry is SRID 4326; area is computed in the local UTM zone. Primary keys are UUIDv7 (`id uuid`). Every table has `created_at timestamptz` and `updated_at timestamptz` unless stated otherwise. Money is `bigint` minor units plus a `currency char(3)` column (ISO 4217). JSON bodies that have a schema in `specs/00-shared/schemas/` are validated on write.

Tenancy: columns marked **RLS** carry `insurer_id` and have a row-level security policy `insurer_id = current_setting('app.insurer_id')::uuid` for insurer sessions. Client sessions are filtered by `client_id` the same way (`app.client_id`). Superadmin sessions set `app.role = 'superadmin'` and read through audited views only. The API connects as role `aigri_app`, which is not a table owner and cannot bypass RLS. See `specs/01-foundation/plan.md` section "RLS".

## Identity and tenancy (owner: 01)

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | id, phone (E.164, unique nullable), email (unique nullable), display_name, honorific, status (`active`, `invited`, `disabled`) | At least one of phone or email |
| `memberships` | id, user_id, kind (`client`, `insurer`, `platform`), client_id null, insurer_id null, role, granted_by, granted_at, revoked_at | Roles: `client_owner`; `product_manager`, `underwriter_adjuster`, `finance`; `superadmin`. One active role per user per tenant. Every change → Audit Log |
| `sessions` | id (opaque token hash), user_id, membership_id, created_at, expires_at, revoked_at, user_agent | Token stored hashed |
| `otp_codes` | id, destination, code_hash, purpose (`sign_in`, `payout_account_change`), expires_at, attempts, consumed_at | 6 digits, 10-minute expiry, 5 attempts |
| `insurers` | id, country (pack code), code (`JSD`), legal_name, display_name, status (`verification`, `live`, `paused`), live_since, verification jsonb (step → done_at, by) | Insurer names come from the pack roster |
| `clients` | id, country, kind (`agri_business`, `individual_farmer`), name, business_id (NIB) null, contact_user_id, address, admin_area jsonb (province, regency, district codes), farms (`crops`, `livestock`, `both`), status | |
| `client_consents` | id, client_id, scope (`platform_terms`, `insurer_share`), insurer_id null, policy_id null, payload_hash, given_by, given_at | Tier 2 consent records |

## Platform core (owner: 01)

| Table | Key columns | Notes |
| --- | --- | --- |
| `audit_events` | seq bigserial PK, ts, actor_type (`person`, `agent`, `system`, `wallet`, `rule`), actor_id null, actor_label, membership_role null, tier (0–3 or null), action (dotted, for example `claim.approved`), object_type, object_id, insurer_id null, client_id null, payload jsonb, prev_hash, hash | Append-only. No `updated_at`. `aigri_app` has INSERT and SELECT only; a trigger rejects UPDATE and DELETE. Hashing: `hashing.md` |
| `outbox` | id, topic, payload jsonb, created_at, published_at null, attempts | Written in the same transaction as the change it announces (`events.md`) |
| `files` | id, owner_client_id null, owner_insurer_id null, kind (`evidence_photo`, `policy_pdf`, `vet_certificate`, `letter`, `ear_tag_photo`, `herd_count_photo`), storage_key, mime, bytes, sha256, phash null, capture jsonb null (lat, lon, accuracy_m, device_time, client_sha256), server_received_at, uploaded_by | Never updated after insert except `phash` once |
| `clock_state` | id = 1, mode (`real`, `demo`), story_now timestamptz | Demo clock (D-09) |
| `notifications` | id, user_id, channel (`push`, `sms`, `email`, `in_app`), template, payload jsonb, status (`queued`, `sent`, `delivered`, `failed`), sent_at, provider_ref | SMS and email go to mock services in the sandbox |
| `push_subscriptions` | id, user_id, endpoint, keys jsonb, created_at, revoked_at | Web Push (VAPID) |

## Assets (owner: 06)

| Table | Key columns | Notes |
| --- | --- | --- |
| `parcels` | id, client_id, code (`DMK-01`), name, geom (MultiPolygon, 4326), area_ha numeric(9,2) (computed), crop, variety, planting_date, irrigation, admin_area jsonb, status | `area_ha` recomputed on geometry change |
| `livestock_groups` | id, client_id, species (`cattle`, `buffalo`, `goat`, `swine`, `poultry`), location (Point), location_label, head_count, avg_value_per_head_minor, currency, last_count_at, last_count_file_id | |
| `ear_tags` | id, group_id, client_id, tag_no, kind (`visual`, `rfid`, `batch`), species, breed, sex, birth_year null, head_count (1, or the batch count), declared_value_minor, photo_file_id, registered_at, status (`alive`, `dead`, `sold`, `missing`), death_date null | Unique `(country, tag_no)` across all clients and insurers |
| `capture_sessions` | id, client_id, purpose (`before_photo`, `claim_photo`, `tag_photo`, `herd_count`), target jsonb (asset ids, claim id), token_hash, expires_at, created_by | The Capture Page opens with a one-time token |

## Policy Records and products (owner: 04)

| Table | Key columns | Notes |
| --- | --- | --- |
| `policy_records` **RLS** | id, insurer_id, record_key (`PR-JSD-RFD-2026`), version, status (`compiling`, `needs_review`, `ready`, `published`, `retired`, `held`), body jsonb (`schemas/policy-record.schema.json`), source_file_id, compiled_at, published_by, published_at | Published rows are immutable; a new PDF creates a new version |
| `record_field_reviews` **RLS** | id, record_id, field_path, state (`flagged`, `accepted`, `edited`), reason, suggested_value jsonb, final_value jsonb, reviewed_by, reviewed_at | Self-check and ambiguity flags |
| `record_clauses` **RLS** | id, record_id, clause_id (`4.1`), page, text, char_start, char_end, embedding vector null | Retrieval index for Q&A; spans only |
| `injection_findings` **RLS** | id, record_id, page, kind (`hidden_text`, `instruction_like`), excerpt, detected_at | Shown in i02 and a03 |

Published Policy Records are readable by every Client session through the view `published_records` (no RLS for reading published bodies; drafts stay tenant-private).

## Risk and Curation (owner: 07)

| Table | Key columns | Notes |
| --- | --- | --- |
| `risk_outputs` | id, asset_type (`parcel`, `livestock_group`), asset_id, client_id, peril, horizon (`d1-16`, `season`), body jsonb (`schemas/risk-output.schema.json`), input_hash, model_version, computed_at | Latest per asset × peril × horizon via an index |
| `forecast_snapshots` | id, source, model, issued_at, location (Point), variables jsonb | Open-Meteo snapshots; inputs to the Risk Model and to alerts (09 reads them) |
| `curation_runs` | id, client_id, formula_version, risk_model_version, input_snapshot jsonb, input_hash, output jsonb (`schemas/curation-run.schema.json`), created_at | Never updated; replay compares a new output to this one |

## Purchase and policies (owner: 08)

| Table | Key columns | Notes |
| --- | --- | --- |
| `quotes` | id, client_id, record_id, record_version, asset_refs jsonb, period_start, period_end, sum_insured_minor, premium_minor, currency, expected_payout_minor, curation_run_id, expires_at | |
| `purchases` **RLS** | id, client_id, insurer_id, quote_id, state (see `events.md`), packet jsonb (`schemas/purchase-packet.schema.json`), packet_hash, confirmed_by, confirmed_at, within_limits bool, underwriting jsonb (decided_by, decision, reason, decided_at) | |
| `policies` **RLS** | id, policy_no, client_id, insurer_id, record_id, record_version, purchase_id, state (`issued`, `active`, `expired`, `cancelled`), period_start, period_end, currency, sum_insured_minor, premium_minor, subsidy jsonb null, issued_at | Record version is frozen at sale |
| `policy_assets` **RLS** | policy_id, insurer_id, asset_type, asset_id, sum_insured_minor | Drives what an insurer may see |

View `insurer_covered_assets`: parcels, livestock groups and Ear Tags joined through `policy_assets` for the session's insurer. Insurer code reads client assets only through this view.

## Hazards and alerts (owner: 09)

| Table | Key columns | Notes |
| --- | --- | --- |
| `hazard_feed_items` | id, source (`gdacs`, `bmkg`, `open_meteo`, `pagasa`), external_id, fetched_at, raw_file_id null, typed jsonb, typed_by (`parser`, `quarantined_reader`) | Raw text is untrusted; only `typed` is used |
| `loss_events` | id, country, name, kind (`flood`, `tropical_cyclone`, `drought`), window_start, window_end null, area (MultiPolygon), sources jsonb, status (`forecast`, `ongoing`, `ended`), created_by (`system`, `client_report`, `fixture`) | `window_end` drives notice deadlines |
| `alerts` | id, client_id, loss_event_id null, kind (`forecast`, `warning`, `info`), asset_refs jsonb, body jsonb, sent_at, channels jsonb | |

## Damage Assessment (owner: 10)

| Table | Key columns | Notes |
| --- | --- | --- |
| `damage_assessments` | id, asset_type, asset_id, client_id, loss_event_id, body jsonb (`schemas/damage-assessment.schema.json`), record_hash, pipeline_version, source (`pipeline`, `fixture`), created_at | Immutable; a rerun writes a new row and links the old one |
| `photo_checks` | id, file_id, claim_id null, checks jsonb (gps_inside, time_in_window, near_duplicate_of, sha_match), created_at | |
| `tag_checks` | id, claim_id, ear_tag_id null, read_tag_no, read_confidence, checks jsonb, created_at | |

## Claims (owner: 11)

| Table | Key columns | Notes |
| --- | --- | --- |
| `claims` **RLS** | id, claim_no, client_id, insurer_id, policy_id, loss_event_id, state (see `events.md`), notice_due_at, settlement_due_at null, paused_since null, packet_complete_at null | One Policy × one Loss Event (unique) |
| `claim_packets` **RLS** | id, claim_id, insurer_id, version, body jsonb (`schemas/claim-packet.schema.json`), hash, drafted_by (`agent`), confirmed_by null, confirmed_at null, kind (`initial`, `resubmission`, `appeal`) | Frozen once confirmed |
| `prechecks` **RLS** | id, claim_id, insurer_id, packet_id, results jsonb (list of check, status, sentence, clause), proposed jsonb (rules engine output), created_at | Drafts only |
| `claim_decisions` **RLS** | id, claim_id, insurer_id, decision (`approved`, `denied`), lines jsonb (asset, proposed_pct, final_pct, amount_minor, reason), final_amount_minor, currency, reason, deny_code null, decided_by, decided_at, packet_hash | Tier 3, person only |
| `info_requests` **RLS** | id, claim_id, insurer_id, message, drafted_by_agent bool, sent_by, sent_at, answered_packet_id null | |
| `appeals` **RLS** | id, claim_id, insurer_id, draft jsonb, packet_id null, state, created_at | |

## Wallet (owner: 12)

| Table | Key columns | Notes |
| --- | --- | --- |
| `wallets` | id, owner_type (`client`, `insurer`, `platform_escrow`), owner_id, insurer_id null **RLS for insurer wallets**, currency, low_balance_alert_minor null, status | One wallet per owner per currency |
| `payout_accounts` | id, wallet_id, kind (`bank`, `ewallet`), provider (`BCA`, `GoPay`), masked_number, account_name, rail (`BI-FAST`), verified_at, is_default, changed_at | Change = Tier 3 with OTP (D-19) |
| `wallet_txns` | id, kind (`top_up`, `premium`, `escrow_release`, `refund`, `payout`, `withdrawal`, `funding`), idempotency_key unique, trigger_event_seq null (Audit Log seq), trigger_ref jsonb, status (`posted`, `failed`), created_at | `payout` requires `trigger_event_seq` of a `claim.approved` event; unique `idempotency_key = 'payout:' + claim_id` |
| `ledger_entries` | id, txn_id, wallet_id, amount_minor (signed), currency, balance_after_minor, created_at | Each txn's entries sum to zero; append-only |

## Nudges and disputes (owner: 14)

| Table | Key columns | Notes |
| --- | --- | --- |
| `nudge_rules` | id, code (`claim_past_settlement`, `claim_due_48h`, `record_unreviewed_7d`, `underwriting_age`), enabled, params jsonb, schedule | D-21, D-29 |
| `nudges` | id, nudge_no, kind (`rule`, `free_text`), rule_code null, insurer_id, subject_type, subject_id, body, drafted_by_agent bool, status (`draft`, `sent`, `seen`, `resolved`), sent_by null, sent_at, seen_at | Shown on the insurer dashboard |
| `disputes` | id, dispute_no, claim_id, client_id, insurer_id, issue, status (`open`, `waiting_insurer`, `resolved`), opened_at, resolved_at, resolution | |
| `system_health` | id, component, status (`ok`, `degraded`, `down`), last_ok_at, detail, checked_at | a01 |
| `ranking_audits` | id, ran_at, sample_size, matches, paid_placement_fields, anomalies jsonb | a01, a03 |
