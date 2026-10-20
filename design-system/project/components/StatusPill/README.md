A status pill states where a purchase, claim or insurer stands, in a word plus a leading dot.

**When to use**
- Anywhere a lifecycle state shows: tables, policy cards, parcel tiles, timeline headers.
- Map status to variant: Approved, Paid, Issued, Active, Live to `pill-ok`; Submitted, Under review, Draft, Awaiting confirmation, Underwriting, Planned to `pill-pending`; Pre-checked to `pill-info`; Info requested, Verification, Needs review to `pill-need`; Denied, Declined to `pill-denied`; Over SLA, Hazard to `pill-alert`.

**What the consumer provides**
- The fixed lifecycle word as text. Purchase: Draft, Awaiting confirmation, Premium paid, Underwriting, Issued, Declined, Active, Expired, Cancelled. Claim: Submitted, Pre-checked, Under review, Info requested, Approved, Denied, Paid, Appeal draft.
- `sandbox` beside any money movement in the demo.

**Do**
- Cross-fade (200ms) when a status changes; do not move the pill.
- Keep ink and background as a pair from the tokens (5.71 to 7.03:1).

**Don't**
- Rely on colour alone; the word and dot are required.
- Use `sun` or `need-bg` as a button fill.
