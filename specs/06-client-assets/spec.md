# 06 Client onboarding and assets: spec

## Summary

A Client signs up as an agri business or an individual farmer, says whether they farm crops, livestock or both, and sees only the matching forms. Crops are Parcels drawn on a map with crop, variety, planting date and area. Livestock is a farm location with species, head count, average value, and Ear Tags registered with a photo. Evidence photos for everything (before-photos, claim photos, tag photos, herd counts) come only through the Capture Page, which records GPS, time and a file hash at capture.

## User stories

**US-06.1 Onboarding (c02).** As Ibu Sri Wahyuni, I set up CV Tani Makmur Demak in about 10 minutes in four steps: account type, what you farm, business details, payout account.
- Given I choose "Agri business" and "Crops", then only crop forms appear later and the business-details step asks for NIB (13 digits, from OSS).
- Given step 4, then I choose a bank account (BI-FAST) or an e-wallet, see the data-sharing promise, and must tick the terms and privacy notice (UU PDP) before "Finish and map my parcels".

**US-06.2 Map parcels (c03).** As the Client, I draw each parcel on a map and list its crop, variety, planting date and irrigation; the area is measured from the boundary.
- Given I draw DMK-01, then the area shows "9,6 ha" with the hint "Measured from the boundary you drew" and the parcel appears in the list as "Not insured yet".
- Given a phone, then the parcel details open in a sheet from each tile.

**US-06.3 Register cattle (c04).** As Pak Slamet, I register each animal with its Ear Tag, breed, sex, age, value and a tag photo, and keep a monthly herd count.
- Given 12 tags registered on 18 Dec 2025, then the Animals table lists them with status pills; a died animal in a claim shows "Died 8 Feb · in claim".
- Given a tag number already registered by anyone on the platform, then registration is refused with "This tag is already registered", without revealing the other owner.

**US-06.4 Capture Page.** As a Client on a phone in a field, I take evidence photos that cannot be swapped later, even with a weak signal.
- Given I open a capture link, then the page asks for camera and location permission, shows what the photo records ("Time and date", "GPS location (must be inside the parcel)", "A fingerprint of the file"), and after I take a photo shows a chip like "14 Feb 2026, 07:12 WIB · −6.8318, 110.7041".
- Given no signal, then the photo is kept on the phone with its hash and uploads automatically when the signal returns.
- Given the GPS is 2 km from the parcel, then the photo is still accepted but flagged for the Adjuster; it does not block the claim.

**US-06.5 Retake request (c04 banner).** As Pak Slamet, when the insurer asks for a clearer tag photo, I see the request on my livestock page and retake it in one tap.

## Functional requirements

- **FR-06.1** Onboarding is a 4-step flow saved after each step (resumable), creating `clients`, the owner membership, a Client Wallet (via feature 12) and the platform-terms consent (`client_consents`, `consent.given`).
- **FR-06.2** Only the forms matching the "farms" choice show (crops, livestock or both) everywhere in the Client portal.
- **FR-06.3** Business details validate NIB as 13 digits for agri businesses in the ID pack; individual farmers give name, phone and village. Province and regency come from the pack regions.
- **FR-06.4** Payout account capture stores a masked number and account name; verification is a sandbox stub in v2 ("We check the name with your bank before the first payout") and changes later follow D-19.
- **FR-06.5** Parcels: draw, edit, delete (only when not on an active Policy) on the `maplibre` renderer; geometry validated (closed, non-self-intersecting, area 0,05–500 ha); area computed in the local UTM zone and rounded to 0,1 ha for display (2 places stored); crop, variety, planting date, irrigation, admin area (district from a point-in-polygon lookup when regions have geometry, else chosen).
- **FR-06.6** Parcel codes are generated per Client (`<REGENCY-PREFIX>-NN`, for example `DMK-01`) and editable names.
- **FR-06.7** Livestock groups: species, location point (with a small map), location label, head count, average value per head. Ear Tags: tag number, kind (visual, RFID, batch for poultry with a head count), breed, sex, birth year or age, declared value, tag photo (Capture Page) and registration time. Tag numbers are unique per country across the platform (`ear_tags` unique index).
- **FR-06.8** Herd count: every 30 days (D-24) the Client is reminded to take a herd or flock count photo through the Capture Page; the quarantined vision reader reads visible tag numbers into a typed list; the count and the tags read are stored and shown ("12 of 12 tags read").
- **FR-06.9** Capture sessions: the server issues a one-time capture token bound to the Client, purpose and targets (assets, claim), valid 24 hours. The Capture Page (`/capture/[token]`) uses the camera (`<input type="file" accept="image/*" capture="environment">` with a `getUserMedia` preview where supported) and the Geolocation API with high accuracy; it records latitude, longitude, accuracy in metres and device time.
- **FR-06.10** The browser computes SHA-256 of the exact bytes it uploads; the server recomputes and rejects a mismatch; stores the file write-once, its perceptual hash and server receipt time (`hashing-and-audit.md`), and writes `file.captured`.
- **FR-06.11** Location check: inside the parcel polygon buffered by the reported accuracy (capped at 100 m), or within 200 m of a livestock location; time check: inside the window the capture session states (for example the Loss Event window, or "before" = before the forecast start). Failures are stored as flags on the photo (`photo_checks`) and never reject the upload.
- **FR-06.12** Offline: the PWA service worker queues captured photos with their metadata and hash in IndexedDB and retries upload with backoff; the hash is computed at capture, not at upload.
- **FR-06.13** Evidence is write-once: no endpoint edits or deletes an evidence file; a Client can mark a photo "do not use" before a packet is confirmed, which excludes it from the packet without deleting it.
- **FR-06.14** Insurer access to assets only through `insurer_covered_assets` (feature 01 RLS).

## Screens

c02 (`system-preview/client/02-onboarding.html`), c03 (`03-parcels.html`), c04 (`04-herd.html`), capture sheets in c04, c10, c11 as a full page at `/capture/[token]`, and "Register an animal" (no prototype, D-14: compose from c02's form card and c04's table).

## Audit entries

`client.created`, `consent.given`, `parcel.created`, `parcel.updated`, `ear_tag.registered`, `file.captured`.

## Bench cases contributed

User effort: onboarding time and taps for a Client with fewer than 10 assets (target ≤20 minutes); evidence fraud red-team: reused photo, wrong location, hash mismatch upload.
