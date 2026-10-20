# Hashing, consent and the Audit Log chain

One implementation lives in `backend/aigri/core/hashing.py`. Nothing else computes these hashes.

## Canonical JSON

All payload hashes use the JSON Canonicalization Scheme, [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (sorted keys, no insignificant whitespace, ECMAScript number serialisation, UTF-8). Use a maintained RFC 8785 library and pin it; add the RFC's test vectors to the unit tests.

Rules for payloads before canonicalisation:

- Money is an integer in minor units plus a currency string. Never a float.
- Timestamps are UTC ISO 8601 with `Z` and second precision.
- Percentages are integers or strings with a fixed number of decimals, never floats.
- IDs are strings.
- Optional fields that are absent are omitted, not `null`, unless the schema says `null` is meaningful.

`payload_hash = "sha256:" + hex(SHA-256(JCS(payload)))`. The UI shows the first 6 and last 4 hex characters (`7c41e9…b02d`) with the full value in `title` and `aria-label` (DESIGN.md 9.17).

## Consent gate (Tier 2)

1. The server builds the packet (purchase or claim), validates it against its schema, freezes it (stores the body and its hash, state `awaiting_confirmation`) and returns both to the client.
2. The Client sees the packet summary and the short hash, ticks the consent box and confirms. The client app sends back `{packet_id, packet_hash}`. It never sends the packet body.
3. `gateway.confirm_tier2(packet_id, packet_hash, user)` loads the frozen body, recomputes the hash, compares it in constant time, checks the user is the Client owner and the state is `awaiting_confirmation`, then performs the action in one transaction and writes the Audit Log entry with the hash.
4. A mismatch, a stale hash or a changed packet returns `409 consent_hash_mismatch` and writes `gateway.denied`.

## Photo hashes

- At capture the browser computes SHA-256 of the exact uploaded bytes (Web Crypto `SubtleCrypto.digest`) and sends it with the file.
- The server recomputes SHA-256 over the received bytes and rejects a mismatch (`422 capture_hash_mismatch`).
- The server computes a perceptual hash (pHash via the `ImageHash` package) and stores it. Near-duplicate = Hamming distance at or below `PHASH_MAX_DISTANCE` (default 8, tuned in the bench) against every earlier evidence photo on the platform.

## Audit Log chain

Each `audit_events` row:

```
entry = {seq, ts, actor_type, actor_id, actor_label, membership_role, tier,
         action, object_type, object_id, insurer_id, client_id, payload}
hash  = "sha256:" + hex(SHA-256(prev_hash_bytes || JCS(entry)))
```

- `prev_hash` of the first row is `"sha256:" + 64 zeros`.
- Rows are written by one function, `core.audit.append(...)`, inside the caller's transaction. A database advisory lock serialises appends so `seq` and `prev_hash` never fork.
- `aigri_app` has INSERT and SELECT on `audit_events` only. A trigger raises on UPDATE and DELETE, as a second wall.
- `core.audit.verify(from_seq, to_seq)` recomputes the chain and returns the first break or `ok`. The Superadmin "Verify chain" button and the nightly job call it and write `audit.chain_verified`.
- Export: `bench` and the deliverables export a run's rows as JSON Lines plus a `chain.txt` with the first and last hash, so a reviewer can recompute it.

## Record hashes

Damage Assessment records and decisions also carry `record_hash` computed the same way over their body, so an Adjuster can see exactly which evidence an approval was bound to.
