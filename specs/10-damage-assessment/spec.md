# 10 Damage Assessment: spec

## Summary

For each covered asset hit by a Loss Event, code writes one immutable Damage Assessment record. For Parcels: flooded share from AiGRI's own Sentinel-1 radar pipeline and from published flood maps, flood duration as a range, NDVI drop from Sentinel-2, an assessed loss % proposal (D-08), a confidence and the sources. For livestock: an Ear Tag match per animal or batch with photo checks. It is evidence for the Adjuster, never a decision, and "not detected" never closes a claim.

## User stories

**US-10.1 Evidence I can read (c11).** As Ibu Sri Wahyuni, for each parcel I see before/after satellite images and readings: flooded %, flood duration, crop change, confidence, in plain words.
- Given DMK-01, then readings show Flooded 92% · Flood duration 9 days · Crop change −75% · Confidence High, and the compare frame sweeps once from 100% to 50%.
- Given DMK-05, then readings show "Flooded: not detected" · Crop change −19% · Confidence Low, with "Radar can miss water under dense rice. This does not close your claim."

**US-10.2 Technical depth for the Adjuster (i04).** As Dimas Prasetyo, I see per parcel: flooded % per source (S-1 VV, GFM, national map), duration range, NDVI before → after, confidence with reasons, and the exact scenes used.

**US-10.3 Livestock checks.** As the Adjuster, for Pak Slamet's claim I see each tag's checks: tag visible, tag on this policy, duplicate tag, photo reuse, location and time, vet certificate.
- Given GBG-0489's tag photo is blurred, then "Tag visible: unreadable" is flagged and the agent asks the Client for a clearer photo; the claim stays open.

**US-10.4 Honest about limits.** As a judge, I can see the pipeline's measured agreement with published flood maps on real events, per source, with its known limits.

## Functional requirements

Crop pipeline (brief "Our pipeline, step by step"):

- **FR-10.1** Trigger: `loss_event.updated` with affected assets; search area = bounding box of affected Parcels; pre-event window and post-event window from the Loss Event dates (configurable lengths).
- **FR-10.2** Search Microsoft Planetary Computer STAC (`https://planetarycomputer.microsoft.com/api/stac/v1`) with `pystac-client` for `sentinel-1-rtc` (GRD fallback, D-27) and `sentinel-2-l2a`; sign assets with the `planetary-computer` package; load with `stackstac` into the local UTM zone.
- **FR-10.3** Flood mask per post-event radar date: a pixel is flooded when VV backscatter is below a per-scene water threshold and has dropped against the pre-event median; permanent water (GFM reference water mask) is removed; a VV rise over crop is flagged as possible flooded vegetation, never counted as dry. Thresholds are versioned configuration.
- **FR-10.4** Flood duration range per Parcel: from the first to the last flooded acquisition (minimum) and to the next dry acquisition (maximum).
- **FR-10.5** NDVI = (B08 − B04) ÷ (B08 + B04); drop SCL cloud, cloud-shadow and cirrus pixels; NDVI drop = pre-event median minus post-event median over valid pixels; record the valid-pixel share and the relative change for the Client label.
- **FR-10.6** Clip to the Parcel polygon (rasterio masks for rasters, PostGIS intersection for published vectors); each source keeps its own per-Parcel value.
- **FR-10.7** Published maps: Copernicus GFM via its API (registration and bearer token) for observed flood extent, exclusion mask and advisory flags; national maps (ID: BRIN or BNPB when published; PH: PhilSA, UNOSAT) when available as vectors.
- **FR-10.8** Cross-check: compare our flooded % with each published value; agreement within a configured tolerance raises confidence; disagreement is listed with both values.
- **FR-10.9** Confidence starts high and drops one step per reason, every reason listed: only one source available; sources disagree; Parcel under the GFM exclusion mask or an advisory flag; crop at a dense-canopy stage; optical valid share under half; too few pixels.
- **FR-10.10** Assessed loss % proposal (D-08): vulnerability table (flood duration class × crop stage → damage fraction) × flooded share, with the NDVI relative drop as a floor when no flood is detected; rounded to whole percent; method and table version recorded. The Adjuster can change it with a reason (feature 11).
- **FR-10.11** Status: `detected`, `not_detected` (no flood and no significant NDVI drop) or `partial_data`. `not_detected` triggers a request for Capture Page photos; it never closes a claim.
- **FR-10.12** Write the record (`damage-assessment.schema.json`), compute `record_hash`, store immutably, write `damage_assessment.written`, emit the event. A rerun writes a new record and links the previous one.
- **FR-10.13** Before/after imagery for the UI: render the clipped pre and post scenes per Parcel as web images (radar as grayscale VV, optical as true colour where valid) with scene dates, stored as derived files referenced by the record.

Fixture mode:

- **FR-10.14** For synthetic Loss Events (D-05), `source_mode = fixture`: the record values come from `seed/` fixtures; imagery is a pre-rendered illustrative pair; the record's sources list says "fixture"; client and insurer screens show the demo note on claim pages in the sandbox.

Photo and livestock checks:

- **FR-10.15** For each claim photo: SHA-256 matches capture; location inside the Parcel (or within 200 m of the livestock location); time inside the Loss Event window (or before it for before-photos); near-duplicate search by perceptual hash across the platform (Hamming ≤ `PHASH_MAX_DISTANCE`); results stored in `photo_checks`.
- **FR-10.16** For each claimed animal: the quarantined vision reader reads the tag number from the claim photo into a typed field with a confidence; checks per the brief table (tag visible, tag on this policy, duplicate tag across all insurers returning only match/no match, poultry count ≤ last registered count, photo reuse, location and time, vet certificate attached with date, cause and count read by the quarantined reader). A failed check flags and asks for evidence; it never closes a claim.
- **FR-10.17** The livestock Damage Assessment lists every tag or batch with its checks and `matched` flag; the rules engine turns matched heads into the mortality amount (feature 05).

## Non-functional

- Per-Parcel crop assessment under 5 minutes for a 40-parcel event on the reference machine with cached scenes; report measured time.
- All satellite access respects Copernicus and Planetary Computer terms; attribution shown wherever imagery appears.

## Audit entries

`damage_assessment.written`, `agent.call` (tag reads, vet certificates).

## Bench cases contributed

Damage Assessment accuracy (D-36): agreement of our Sentinel-1 flooded % and overlap with GFM on the two Demak 2024 events (ID) and with PhilSA on Inday (PH), per source with the known limit; confidence calibration (share of high-confidence parcels within tolerance). Claim scenarios: low-confidence flood, conflicting photo, livestock tag mismatch. Red team: reused photo, duplicate tag across insurers.
