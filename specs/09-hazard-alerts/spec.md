# 09 Hazards, Loss Events and alerts: spec

## Summary

AiGRI watches official warnings, cyclone feeds and forecasts for every registered asset. When a hazard is likely, the Client gets an alert by push, SMS and email with plain pre-storm steps, the parcels at risk, the rain forecast, and the claim deadline that would apply. Hazard occurrences become Loss Events, which trigger Damage Assessment and the claim offer after the event. The Client's Home shows all of this on the morning it matters.

## User stories

**US-09.1 Warned in time (c09, c10).** As Ibu Sri Wahyuni on 4 Feb 2026, I get a flood warning at 06:10 WIB, 40 minutes after BMKG's heavy-rain warning, telling me 5 of my 6 parcels are in the likely flood area and what to do now.
- Given the BMKG warning for Demak, Grobogan and Kudus at 05:30 WIB and my seeded forecast, then an alert is sent by push (06:10), SMS (06:10, sandbox) and email (06:11), and c10 lists the 5 parcels with distance to river and 7-day flood chance (78%, 71%, 64%, 52%, 38%) and notes DMK-06 is outside (11%).
- Given the alert, then Home shows the strong alert banner "Flood warning for 5 of your 6 parcels" with "See what to do".

**US-09.2 Take before-photos.** As the Client, I take one before-photo per parcel from the alert in a few taps (capture sheet, 0 of 5 counter).

**US-09.3 Know my deadline before I need it.** As the Client, I see "Report within 7 days after the flood ends" with the clause, on the alert, before any damage happens.

**US-09.4 After the event.** As the Client, when the water recedes, AiGRI asks whether my farm was affected and, if yes, starts drafting the claim (feature 11).

**US-09.5 Home (c09).** As the Client, my Home shows the alert banner, my farm, my cover, my wallet, this week's risk with the rain chart, a "To do before the rain" checklist, my claims, and recent activity.

## Functional requirements

- **FR-09.1** Ingest GDACS tropical cyclone events (RSS/GeoJSON event list, no key) every 30 minutes; parse with code (structured feeds), not the model. Store typed items in `hazard_feed_items`.
- **FR-09.2** Ingest official warnings for the active pack: BMKG for ID. Use a structured BMKG feed if one is available; otherwise fetch the public warning pages and pass the text to the quarantined reader to fill a `HazardWarning` schema (areas, hazard, start, end, severity, issued_at). PH pack: PAGASA bulletins the same way (planned). D-27.
- **FR-09.3** Forecasts come from feature 07's Open-Meteo snapshots; this feature reads them, it does not call the API separately.
- **FR-09.4** Loss Events: created from (a) an official warning or cyclone event covering at least one registered asset, (b) a Client report ("Report damage" with peril and dates), or (c) a fixture (demo). Each has a window (start, end when known), area, sources, status (`forecast` → `ongoing` → `ended`). `window_end` is set from the warning end, from satellite evidence that water receded (feature 10), or by the Client's report, whichever comes first with evidence; changes are logged.
- **FR-09.5** Alert rule (D-22): alert a Client when any asset's 7–16 day loss probability is at least the pack's `alert_loss_probability`, or an official warning covers the asset's regency. One alert per Client per Loss Event, updated (not re-sent) unless the forecast worsens a level.
- **FR-09.6** Alert content is template-based (`alert.send`, Tier 0): affected assets, the peril and dates, the source and issue time, the rain forecast series and threshold, numbered steps from a versioned step library per peril × crop or species (c10 steps for flood × rice; livestock steps for cattle), and the notice deadline rule from each covering Policy Record with its clause.
- **FR-09.7** Channels: Web Push (VAPID) to every subscription; SMS (mock) to the Client's phone with a short text and link; email (mock) with the full alert. Delivery statuses stored in `notifications` and shown on c10 ("How you were told").
- **FR-09.8** Before-photo requests: the alert creates a capture session (feature 06) for the affected assets with purpose `before_photo`; Home and c10 show progress (0 of 5).
- **FR-09.9** When a Loss Event ends and a covered asset was in its area, ask the Client "Was your farm affected?" (push + in-app). "Yes" or "Not sure" starts damage assessment and claim drafting (10, 11); "No" records the answer and keeps watching (claim state "Closed; keep watching" is not created; nothing is filed).
- **FR-09.10** Home (c09) aggregates: active alert banner (`.banner-alert.is-strong`, `role="alert"` once), farm card, cover card, wallet card, this week's risk card with peril seg and rain chart, to-do checklist (page-local ticks stored per user), claims card (empty state or latest), recent activity from the Audit Log (Client-visible actions only).
- **FR-09.11** Demo story jump (sandbox only): c10 shows the info banner "Demo: jump to 16 Feb 2026, after the flood" that moves the demo clock and opens the drafted claim.

## Non-functional

- Alert delivered within 60 minutes of the official warning in normal operation; bench reports the measured lead time on backtests.
- Feed failures surface in system health (feature 14) and never produce a false "all clear".

## Screens

c09 (`system-preview/client/09-home.html`), c10 (`10-alert.html`), the alerts list `/client/alerts`.

## Audit entries

`hazard.ingested`, `loss_event.created`, `alert.sent`.

## Bench cases contributed

Historical backtests: Demak 8 Feb 2024 and 16–17 Mar 2024 events replayed on synthetic farms placed in the affected districts (assets alerted, lead time, claims that would be filed before each record's notice deadline); PH: the Nov 2025 typhoon and Inday for the PH pack.
