The wallet balance is the one green card in the product: the balance as a large number, the actions, and the transactions beneath it.

**When to use**
- On the client Wallet screen only. `card-green` is reserved for this balance; do not use it for other cards.

**What the consumer provides**
- A `wallet-hero` with a `label` "Wallet balance" and a `sandbox` pill, the `num-xl` balance, a `meta` line ("Available now · Indonesia · IDR") and the linked account ("BCA ••••4821 via BI-FAST").
- Actions: `btn-w` Withdraw and `btn-ghost` Add funds (white on green).
- `txn` rows: a 40px status circle with an arrow icon, a title, a `small muted` line with date and reference, and the amount right-aligned. Incoming is `txn is-in` (`ok` on `ok-bg`) with `+Rp187.800.000`; outgoing is `surface-2` with ink `−Rp13.440.000`.
- Amounts and currency from the country pack.

**Do**
- Count the balance up (900ms `ease-out`) only when a payout has just arrived (`data-count`); otherwise show the number.
- Set `label` and `meta` text on `green` to solid white. The built-in 86% white measures 4.17:1 on `green`, under 4.5.

**Don't**
- Show the balance in a compact form.
- Put `sun` or yellow on this card.
