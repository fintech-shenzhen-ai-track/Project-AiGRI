The app shell is the navigation frame: a sidebar on desktop, an icon rail on compact screens, and a top bar plus five bottom tabs on mobile.

**When to use**
- Every screen in the Client, Insurer and Superadmin portals. Insurer and Superadmin are desktop only (designed at 1280px); the Client has the mobile layout.

**What the consumer provides**
- `side` (`surface-2`) holding the logo (horizontal colour, 41px tall), a `side-portal` tag in 13px caps ("Client", "Asuransi Jasindo", "Superadmin"), `side-nav` of `nav-item` links (44px, icon plus label), and `side-foot` with the `country` chip ("Indonesia · IDR") and the signed-in `me` block (role under the name for insurers).
- Active item: `aria-current="page"` (white fill, ink 600, `green` icon). Disabled: `aria-disabled="true"`. Counts: `nav-badge` (`ink`) or `nav-badge is-need`.
- `topbar` (64px, white, sticky) with `crumbs`, search and the bell; it gains a shadow after 8px of scroll.
- Mobile Client: `mbar` with the symbol logo (32px), the page title and the bell; `tabbar` with Home, Farm, Cover, Claims, Wallet (icon over a 13px label, 48px targets). Alerts live behind the bell.
- Between 601 and 1023px the sidebar collapses to a 76px icon rail with tooltips.

**Do**
- Keep nav changes instant with only press feedback; nav is used many times a day.
- Add `<a class="skip">` to the main content as the first focusable element.

**Don't**
- Play the sun-rise animation in the sidebar.
- Hide the country chip; it stays visible and quiet.
