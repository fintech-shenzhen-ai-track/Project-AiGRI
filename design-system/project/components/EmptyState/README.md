Empty, loading and error states tell a person what is missing, what is loading or what failed, and what to do next.

**When to use**
- `empty` when a list has nothing yet: a 64px `surface-2` circle with a 28px icon, an `h-card` title, one helpful line and one action.
- `skel` blocks while data loads, shaped like the real layout. The container carries `aria-busy="true"`; skeletons breathe between `surface-2` and `surface-3` only while it does.
- `error-state` (`denied-bg`) when a load fails.

**What the consumer provides**
- For empty: title, one sentence and one action, in plain words ("If a flood or drought hits a covered parcel, AiGRI drafts the claim for you.").
- For error: what failed, what is not affected, how to retry ("Your claim is not affected. Try again.").
- For loading: skeleton heights and widths that match the content.

**Do**
- Offer one action only.
- Stop the breathe when loading ends; under reduced motion skeletons are static.

**Don't**
- Centre a spinner over content.
- Blame the person or write "Oops".
