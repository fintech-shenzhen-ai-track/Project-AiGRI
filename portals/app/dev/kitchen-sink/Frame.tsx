import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { IconLink } from "@/components/Button";
import { Icon, type IconName } from "@/components/icons/sprite";
import { LogoHorizontal, LogoSymbol } from "@/components/logo";

// The client-portal chrome around the kitchen sink (sidebar, top bars, tab bar), as in _kitchen-sink.html.
// TEMPORARY: static markup so the page can be compared with the prototype before the AppShell exists. T-03.15
// replaces it with <AppShell portal="client">; T-03.19 moves the page under the /dev layout.

const NAV: { key: string; label: string; icon: IconName; badge?: string; current?: boolean }[] = [
  { key: "home", label: "Home", icon: "home", current: true },
  { key: "farm", label: "My farm", icon: "farm" },
  { key: "risk", label: "Risk", icon: "chart" },
  { key: "cover", label: "Cover", icon: "shield" },
  { key: "claims", label: "Claims", icon: "file-check" },
  { key: "wallet", label: "Wallet", icon: "wallet" },
  { key: "alerts", label: "Alerts", icon: "bell", badge: "1" },
];

const TABS: { label: string; icon: IconName; current?: boolean }[] = [
  { label: "Home", icon: "home", current: true },
  { label: "Farm", icon: "farm" },
  { label: "Cover", icon: "shield" },
  { label: "Claims", icon: "file-check" },
  { label: "Wallet", icon: "wallet" },
];

export function KitchenSinkFrame({ country, children }: { country: string; children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="shell" data-portal="client" data-page="home">
        <aside className="side" aria-label="Main navigation">
          <div className="side-inner">
            <a className="side-logo" href="#" aria-label="AiGRI home">
              <LogoHorizontal />
            </a>
            <p className="side-portal">Client</p>
            <nav className="side-nav" aria-label="Sections">
              {NAV.map((n) => (
                <a key={n.key} className="nav-item" href="#" title={n.label} aria-current={n.current ? "page" : undefined}>
                  <Icon name={n.icon} />
                  {n.label}
                  {n.badge ? <span className="nav-badge is-need">{n.badge}</span> : null}
                </a>
              ))}
            </nav>
            <div className="side-foot">
              <span className="country">
                <Icon name="globe" size="sm" />
                {country}
              </span>
              <div className="me">
                <Avatar initials="SW" />
                <span className="me-text">
                  <span className="me-name">Ibu Sri Wahyuni</span>
                  <span className="me-meta">CV Tani Makmur Demak</span>
                </span>
              </div>
            </div>
          </div>
        </aside>
        <div className="main">
          <header className="mbar">
            <a className="logo-link" href="#" aria-label="AiGRI home">
              <LogoSymbol />
            </a>
            <span className="mbar-title">Kitchen sink</span>
            <IconLink icon="bell" label="Alerts, 1 new" href="#" dot />
          </header>
          <header className="topbar">
            <nav className="crumbs" aria-label="Breadcrumb">
              <a href="#">Shared</a>
              <span className="crumb-sep">›</span>
              <span aria-current="page">Kitchen sink</span>
            </nav>
            <div className="topbar-actions">
              <IconLink icon="bell" label="Alerts, 1 new" href="#" dot />
              <Avatar initials="SW" decorative />
            </div>
          </header>
          <main id="main" className="page">
            {children}
          </main>
        </div>
      </div>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <a key={t.label} className="tab" href="#" aria-current={t.current ? "page" : undefined}>
            <Icon name={t.icon} size="lg" />
            {t.label}
          </a>
        ))}
      </nav>
    </>
  );
}
