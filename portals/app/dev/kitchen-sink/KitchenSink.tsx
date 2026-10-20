"use client";

import type { CSSProperties } from "react";
import { Avatar } from "@/components/Avatar";
import { Banner } from "@/components/Banner";
import { Button, ButtonLink, IconButton } from "@/components/Button";
import { Card, CardLink } from "@/components/Card";
import { BarChart, LineChart, ShowAsTable, Sparkline } from "@/components/Chart";
import { Check, Radio } from "@/components/Check";
import { CheckList } from "@/components/CheckList";
import { Chip, ChipGroup } from "@/components/Chip";
import { Choice, SelectGroup } from "@/components/Choice";
import { Cite } from "@/components/Cite";
import { Consent } from "@/components/Consent";
import { CountUp } from "@/components/CountUp";
import { DemoNote } from "@/components/DemoNote";
import { Disclosure } from "@/components/Disclosure";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Affix, Field, Input, Select, Textarea } from "@/components/Field";
import { Flow, FlowControls, FlowStep, Stepper } from "@/components/Flow";
import { Hash } from "@/components/Hash";
import { Icon, ICON_NAMES } from "@/components/icons/sprite";
import { InsMark } from "@/components/InsMark";
import { Kv } from "@/components/Kv";
import { LogoHorizontal } from "@/components/logo";
import { Legend, MapView } from "@/components/Map";
import { Meter } from "@/components/Meter";
import { Modal, useDialog, useDialogClose } from "@/components/Modal";
import { Otp } from "@/components/Otp";
import { ParcelTile } from "@/components/ParcelTile";
import { Photo, PhotoGrid } from "@/components/Photo";
import { PolicyCard } from "@/components/PolicyCard";
import { Reveal } from "@/components/Reveal";
import { SandboxPill } from "@/components/SandboxPill";
import { SatelliteCompare, SatReadings } from "@/components/SatelliteCompare";
import { Seg } from "@/components/Seg";
import { Sheet } from "@/components/Sheet";
import { Skeleton } from "@/components/Skeleton";
import { Stat } from "@/components/Stat";
import { StatusPill } from "@/components/StatusPill";
import { Switch } from "@/components/Switch";
import { Table, TableTools, TBody, Td, Th, THead, Tr } from "@/components/Table";
import { Tabs } from "@/components/Tabs";
import { Timeline } from "@/components/Timeline";
import { ToastView } from "@/components/Toast";
import { Upload } from "@/components/Upload";
import { SunRiseMark } from "@/components/SunRise";
import { useFormat } from "@/lib/pack";
import { toast } from "@/lib/toast";
import { fromFrame, KIT_PARCELS, MAP_BACKDROP, MAP_BOUNDS } from "./map-data";
import { KitchenSinkFrame } from "./Frame";

const sub = (s: string) => <p className="kit-sub">{s}</p>;

/** Every component and state from system-preview/shared/_kitchen-sink.html, built from the React components. */
export function KitchenSink() {
  const f = useFormat();
  const m = (n: number) => f.moneyMajor(n);
  const minor = (n: number) => ({ amount_minor: n, currency: f.pack.currency.code });
  const ins = (code: string) => f.pack.insurers.find((i) => i.code === code) ?? { code, name: code, initials: code.slice(0, 2) };
  const jsd = ins("JSD");
  const ask = ins("ASK");
  const bmkg = f.pack.hazard_sources.find((h) => h.id === "bmkg")?.name.split(" ")[0] ?? "";
  const rail = f.labels.payoutRails[0] ?? "";
  const country = `${f.pack.name} · ${f.labels.currencyCode}`;
  const at = (iso: string) => f.dateTime(iso);
  const premium = m(13440000);
  const modal = useDialog();
  const sheet = useDialog();
  const clause = (label: string) => (
    <Cite onClick={sheet.show} key={label}>
      {label}
    </Cite>
  );

  return (
    <KitchenSinkFrame country={country}>
      <div className="page-head">
        <Reveal as="p" className="eyebrow">
          PKG-0 · Shared system
        </Reveal>
        <Reveal as="h1" className="title" i={1}>
          Kitchen sink
        </Reveal>
        <Reveal as="p" className="lead" i={2}>
          Every component and state in system.css, in one place. Open with <span className="mono">?still</span> to freeze motion.
        </Reveal>
        <Reveal className="page-actions" i={3}>
          <Button variant="soft" icon="plus" onClick={() => toast("Saved.", { tone: "ok" })}>
            Add item
          </Button>
          <Button variant="ink" onClick={() => toast("Continue pressed.", { tone: "info" })}>
            Continue
          </Button>
        </Reveal>
      </div>

      {/* tokens */}
      <section className="section" id="k-colour">
        <h2 className="h-section">Colour</h2>
        {sub("Core")}
        <div className="grid-4">
          {[
            ["ink", "ink", true],
            ["muted", "muted", true],
            ["muted-2", "muted-2", true],
            ["disabled", "disabled", false],
            ["green", "green", true],
            ["leaf", "leaf", true],
            ["sun", "sun (CTA only)", false],
            ["cream", "cream", false],
            ["surface-1", "surface-1", false],
            ["surface-2", "surface-2", false],
            ["surface-3", "surface-3", false],
            ["track", "track", false],
          ].map(([token, label, dark]) => (
            <div key={token as string} className={`kit-sw${dark ? " on-dark" : ""}`} style={{ "--c": `var(--${token})` } as CSSProperties}>
              {label as string}
            </div>
          ))}
        </div>
        {sub("Status ink on background")}
        <div className="grid-3">
          {(
            [
              ["ok", "var(--muted)"],
              ["pending", "var(--muted)"],
              ["info", "var(--info)"],
              ["need", "var(--need)"],
              ["denied", "var(--denied)"],
              ["alert", "var(--alert)"],
            ] as const
          ).map(([tone, ink]) => (
            <div key={tone} className="kit-sw" style={{ "--c": `var(--${tone}-bg)`, color: tone === "ok" ? "var(--ok)" : ink } as CSSProperties}>
              {tone}
            </div>
          ))}
        </div>
        {sub("Map and data")}
        <div className="grid-4">
          {[
            ["map-land", false],
            ["map-water", false],
            ["water", true],
            ["parcel-risk", true],
            ["parcel-off", false],
          ].map(([token, dark]) => (
            <div key={token as string} className={`kit-sw${dark ? " on-dark" : ""}`} style={{ "--c": `var(--${token})` } as CSSProperties}>
              {token as string}
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="k-type">
        <h2 className="h-section">Type</h2>
        <div className="stack-sm">
          <p className="eyebrow" style={{ margin: 0 }}>
            Eyebrow 13 caps
          </p>
          <p className="num-xl">{m(199360000)}</p>
          <p className="title">Title, page level</p>
          <p className="num-l">{m(187800000)}</p>
          <p className="h-section">Section heading</p>
          <p className="h-card">Card heading</p>
          <p className="lead">Lead paragraph in muted ink, wrapped for balance and up to 640px wide.</p>
          <p>Body 17px. The adjuster decides within 14 days of a complete claim.</p>
          <p className="small">Small 15px. Secondary text and table cells.</p>
          <p className="meta">Meta 15px muted-2. {at("2026-02-16T08:20:00")}</p>
          <p className="label">Label 13 caps</p>
          <p className="mono">7c41e9…b02d</p>
          <p className="ok-text">ok-text</p>
          <p className="denied-text">denied-text</p>
        </div>
      </section>

      {/* buttons */}
      <section className="section" id="k-buttons">
        <h2 className="h-section">Buttons</h2>
        {sub("Variants (one yellow per view)")}
        <div className="wrap-row">
          <Button variant="y" onClick={() => toast("Confirmed.", { tone: "ok" })}>
            Get covered
          </Button>
          <Button variant="ink">Continue</Button>
          <Button variant="soft">Secondary</Button>
          <Button variant="ghost">View clause</Button>
          <Button variant="danger">Deny claim</Button>
          <span className="card-green" style={{ padding: "12px 20px", borderRadius: 20, display: "inline-flex" }}>
            <Button variant="w">On green</Button>
          </span>
        </div>
        {sub("Sizes, icon, block")}
        <div className="wrap-row">
          <Button size="sm">Small</Button>
          <Button icon="download">With icon</Button>
          <Button size="lg">Large</Button>
          <IconButton icon="search" label="Search" />
          <IconButton icon="bell" label="Alerts, 1 new" dot />
        </div>
        {sub("States")}
        <div className="wrap-row">
          <Button disabled>Disabled</Button>
          <Button loading>Confirm and pay</Button>
          <Button variant="soft" loading>
            Loading
          </Button>
        </div>
        <div className="stack-sm" style={{ marginTop: 16, maxWidth: 420 }}>
          <Button block>Block button</Button>
        </div>
      </section>

      {/* forms */}
      <section className="section" id="k-forms">
        <h2 className="h-section">Forms</h2>
        <div className="grid-2">
          <Field label="Business name" hint="As on your NIB.">
            <Input defaultValue="CV Tani Makmur Demak" />
          </Field>
          <Field label="Phone">
            <Input placeholder={f.pack.format.phone_example ?? ""} />
          </Field>
          <Field label="Business ID (NIB)" error="NIB has 13 digits.">
            <Input defaultValue="12345" />
          </Field>
          <Field label="Disabled">
            <Input defaultValue="Locked" disabled />
          </Field>
          <Field label="Regency">
            <Select defaultValue="Demak">
              <option>Demak</option>
              <option>Grobogan</option>
              <option>Kudus</option>
            </Select>
          </Field>
          <Field label="Area" hint="Measured from the boundary you drew.">
            <Affix suffix={f.labels.areaUnit}>
              <Input defaultValue={f.num(9.6, 1)} inputMode="decimal" />
            </Affix>
          </Field>
          <Field label="Premium">
            <Affix prefix={f.pack.currency.symbol}>
              <Input defaultValue={f.num(13440000)} />
            </Affix>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Anything the adjuster should know" />
          </Field>
        </div>
        {sub("Read-only on a card (compiled policy field)")}
        <Card>
          <Field label="Deductible">
            <div className="row">
              <Input defaultValue="10% of sum insured" readOnly />
              <Cite>Clause 6.2</Cite>
            </div>
          </Field>
        </Card>

        {sub("Choice cards (single select)")}
        <SelectGroup className="grid-2" defaultValue="business" role="group" aria-label="Account type">
          <Choice value="business" icon="building" title="Agri business" description="A CV, UD, PT or other registered business" />
          <Choice value="individual" icon="user" title="Individual farmer" description="You farm in your own name" />
        </SelectGroup>
        {sub("Check, radio, switch")}
        <div className="wrap-row" style={{ gap: 32 }}>
          <Check defaultChecked>I agree to share this data</Check>
          <Check>Unchecked</Check>
          <Check disabled>Disabled</Check>
          <Radio name="r" defaultChecked>
            Wallet
          </Radio>
          <Radio name="r">{rail}</Radio>
          <Switch defaultChecked>Push alerts</Switch>
          <Switch>SMS alerts</Switch>
        </div>
        {sub("Segmented control and chips")}
        <div className="wrap-row" style={{ gap: 32 }}>
          <Seg
            aria-label="Range"
            defaultValue="season"
            options={[
              { value: "season", label: "This season" },
              { value: "16d", label: "Next 16 days" },
            ]}
          />
          <ChipGroup className="wrap-row" multiple defaultValue={["flood", "drought"]} aria-label="Hazards">
            <Chip value="flood">Flood</Chip>
            <Chip value="drought">Drought</Chip>
            <Chip value="pest">Pest and disease</Chip>
          </ChipGroup>
        </div>
        {sub("Upload (default, drag-over, uploading) and OTP")}
        <div className="grid-3">
          <Upload title="Add photos" hint="JPG or PNG. Time and place are recorded." />
          <Upload title="Drop to upload" hint="Release to add." over />
          <Upload title="IMG_2041.jpg" progress={0.62} progressText={f.pct(62)} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Otp defaultValue="481" />
        </div>
      </section>

      {/* surfaces */}
      <section className="section" id="k-surfaces">
        <h2 className="h-section">Surfaces</h2>
        <div className="grid-3">
          <Card>
            <h3 className="h-card">Card</h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              On white, surface-2.
            </p>
          </Card>
          <div className="card-w kit-box">
            <Card tone="w">
              <h3 className="h-card">Card white</h3>
              <p className="small muted" style={{ marginTop: 8 }}>
                White on a surface-2 area.
              </p>
            </Card>
          </div>
          <Card large>
            <h3 className="h-card">Card large</h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              28px radius, 32px padding.
            </p>
          </Card>
          <Card tone="ink">
            <h3 className="h-card">Card ink</h3>
            <p className="small" style={{ marginTop: 8 }}>
              The one decisive item.
            </p>
            <Button variant="w" size="sm" style={{ marginTop: 16 }}>
              Open
            </Button>
          </Card>
          <Card tone="green">
            <h3 className="h-card">Card green</h3>
            <p className="small" style={{ marginTop: 8 }}>
              Wallet balance only.
            </p>
          </Card>
          <Card tone="cream">
            <h3 className="h-card">Card cream</h3>
            <p className="small" style={{ marginTop: 8 }}>
              Next-step band, consent.
            </p>
          </Card>
        </div>
        <div className="grid-2" style={{ marginTop: 24 }}>
          <CardLink href="#">
            <Avatar initials="CV" white />
            <span className="grow">
              <span className="h-card" style={{ display: "block" }}>
                CV Tani Makmur Demak
              </span>
              <span className="small muted">Client · rice SME, Demak</span>
            </span>
          </CardLink>
          <Card>
            <Kv
              items={[
                { label: "Policy", value: "POL-JSD-26-004127" },
                { label: "Premium", value: m(13440000), meta: f.pct(3.5, 1) },
                { label: "Status", value: <StatusPill tone="ok">Active</StatusPill> },
              ]}
            />
          </Card>
        </div>
        {sub("Stat tiles and meter")}
        <div className="grid-4">
          <Stat label="Open claims" value={f.num(41)} meta="3 due in 48 h" />
          <Stat label="Paid since 1 Feb" value={f.moneyMajor(412600000, { compact: true })} valueTitle={m(412600000)} meta="21 payouts" />
          <Stat label="Median decision" value={`${f.num(5.1, 1)} days`}>
            <Sparkline values={[2, 6, 4, 14, 11, 18, 20]} />
          </Stat>
          <div className="stat">
            <span className="label">Coverage used</span>
            <span className="num-l">{f.pct(62)}</span>
            <Meter value={0.62} label={`${f.num(62)} percent`} />
          </div>
        </div>
      </section>

      {/* policy */}
      <section className="section" id="k-policy">
        <h2 className="h-section">Policy card</h2>
        <div className="stack">
          <PolicyCard
            rank={1}
            top
            i={0}
            insurer={jsd}
            name="Rice Flood & Drought Cover"
            badge={<StatusPill tone="ok" pop delay={200}>Best fit for your risk</StatusPill>}
            ratio={{ value: f.num(1.46, 2), meta: `expected payout per ${f.money(minor(1))} of premium` }}
            figures={[
              { label: "Premium", value: m(13440000), meta: `${f.rate(minor(280000), "area")} · ${f.pct(3.5, 1)}` },
              { label: "Sum insured", value: m(384000000), meta: f.rate(minor(8000000), "area") },
              { label: "Expected payout", value: m(19622400) },
            ]}
            whyLabel="Why it ranks here"
            why={[
              { text: "Covers flood and drought, your two highest risks", cites: [clause("Clause 4.1"), clause("Clause 4.2")] },
              { text: "Pays from 10% loss, so partial floods count", cites: clause("Clause 6.2") },
            ]}
            actions={
              <>
                <ButtonLink href="#" variant="ink">
                  See policy
                </ButtonLink>
                <Button variant="ghost">Compare</Button>
              </>
            }
          />
          <PolicyCard
            rank={2}
            i={1}
            insurer={ask}
            name="Rice Yield Protect"
            ratio={{ value: f.num(1.31, 2), meta: `expected payout per ${f.money(minor(1))} of premium` }}
            figures={[
              { label: "Premium", value: m(11520000), meta: `${f.rate(minor(240000), "area")} · ${f.pct(3.2, 1)}` },
              { label: "Sum insured", value: m(360000000), meta: f.rate(minor(7500000), "area") },
              { label: "Expected payout", value: m(15091200) },
            ]}
            why={[
              { text: "Covers flood, drought and pests", cites: <Cite>Clause 4.1</Cite> },
              { text: "Pays only from 20% loss, so smaller floods don't count", minus: true, cites: <Cite>Clause 5.3</Cite> },
            ]}
            actions={
              <ButtonLink href="#" variant="soft">
                See policy
              </ButtonLink>
            }
          />
          <PolicyCard
            off
            i={2}
            insurer={jsd}
            name="AUTP Rice (government scheme)"
            status={<StatusPill tone="pending">Not eligible</StatusPill>}
            note={
              <>
                For farmer-group members farming up to {f.area(2)}. Your business farms {f.area(48)}. <Cite>Scheme rule 2.1</Cite>
              </>
            }
          />
        </div>
        <DemoNote />
      </section>

      {/* data */}
      <section className="section" id="k-data">
        <h2 className="h-section">Tables, pills, tabs</h2>
        {sub("Status pills")}
        <div className="wrap-row">
          <StatusPill tone="ok">Approved</StatusPill>
          <StatusPill tone="ok">Paid</StatusPill>
          <StatusPill tone="pending">Under review</StatusPill>
          <StatusPill tone="info">Pre-checked</StatusPill>
          <StatusPill tone="need">Info requested</StatusPill>
          <StatusPill tone="denied">Denied</StatusPill>
          <StatusPill tone="alert">Over SLA</StatusPill>
          <StatusPill tone="info" icon="file-pen">
            Drafted by AiGRI
          </StatusPill>
          <SandboxPill />
        </div>
        {sub("Tabs with counts")}
        <Tabs
          aria-label="Claims"
          tabs={[
            {
              id: "all",
              label: "All",
              badge: 59,
              panel: (
                <>
                  <TableTools>
                    <Chip inert selected>
                      All
                    </Chip>
                    <Chip inert>Due in 48 h</Chip>
                    <div className="field" style={{ flex: 1, maxWidth: 280 }}>
                      <input className="input" style={{ height: 40 }} placeholder="Search claims" aria-label="Search claims" />
                    </div>
                    <span className="count">41 open claims</span>
                  </TableTools>
                  <Table>
                    <THead>
                      <tr>
                        <Th>Claim</Th>
                        <Th>Client</Th>
                        <Th>Status</Th>
                        <Th right>Proposed</Th>
                        <Th>Due</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {(
                        [
                          ["CLM-26-000409", "UD Sumber Pangan Kudus", "pending", "Under review", 74880000, f.date("2026-02-25"), "row"],
                          ["CLM-26-000418", "CV Tani Makmur Demak", "pending", "Under review", 190400000, f.date("2026-03-06"), "sel"],
                          ["CLM-26-000431", "Pak Slamet Santoso", "need", "Info requested", 20000000, "Paused", "flag"],
                          ["CLM-26-000422", "Ibu Siti Aminah", "ok", "Paid", 4800000, f.date("2026-02-23"), "row"],
                        ] as const
                      ).map(([no, client, tone, status, amount, due, kind], i) => (
                        <Tr key={no} href={i === 0 ? "#" : undefined} selected={kind === "sel"} flagged={kind === "flag"}>
                          <Td ident label="Claim">
                            {no}
                          </Td>
                          <Td label="Client">{client}</Td>
                          <Td label="Status">
                            <StatusPill tone={tone}>{status}</StatusPill>
                          </Td>
                          <Td num label="Proposed">
                            {m(amount)}
                          </Td>
                          <Td label="Due">{due}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </>
              ),
            },
            { id: "open", label: "Open", badge: 41, panel: <p className="small muted">Open claims panel.</p> },
            { id: "info", label: "Info requested", badge: 5, badgeTone: "need", panel: <p className="small muted">Info requested panel.</p> },
          ]}
        />
        {sub("Legend, hash, avatar, insurer mark")}
        <div className="wrap-row" style={{ gap: 24 }}>
          <Legend
            items={[
              { label: "Insured parcel", color: "parcel" },
              { label: "Forecast flood area", color: "parcel-risk" },
              { label: "Flood extent", color: "water" },
              { label: "River", color: "map-water" },
            ]}
          />
          <Hash value="7c41e9a2b1…b02d" display="7c41e9…b02d" />
          <Avatar initials="DP" />
          {f.pack.insurers.map((i) => (
            <InsMark key={i.code} initials={i.initials} />
          ))}
        </div>
      </section>

      {/* feedback */}
      <section className="section" id="k-feedback">
        <h2 className="h-section">Feedback</h2>
        <div className="stack-sm">
          <Banner tone="ok" title="Policy issued">
            POL-JSD-26-004127 is active from {f.date("2026-01-10")}.
          </Banner>
          <Banner tone="info" title="AiGRI drafted this claim" actions={<Button variant="ghost" size="sm">Review</Button>}>
            Check each parcel, then confirm. You decide.
          </Banner>
          <Banner
            tone="need"
            icon="camera"
            title="Retake the tag photo for GBG-0489"
            actions={<Button variant="ink" size="sm">Retake tag photo</Button>}
          >
            {jsd.name} asked on {f.date("2026-02-23")}. Hold the tag flat, in daylight.
          </Banner>
          <Banner tone="denied" title="Claim denied">
            Notice was filed on day 9 (Clause 8.1). You can appeal.
          </Banner>
          <Banner tone="alert" title="SMS sandbox degraded">
            Delivery delayed about 4 min.
          </Banner>
          <Banner
            tone="alert"
            strong
            role="status"
            title="Flood warning for 5 of your 6 parcels"
            actions={<ButtonLink href="#" variant="w" size="sm">See the alert</ButtonLink>}
          >
            {bmkg} heavy-rain warning issued {at("2026-02-04T05:30:00")}.
          </Banner>
        </div>
        <div className="grid-3" style={{ marginTop: 24 }}>
          <Card>
            <EmptyState title="No claims yet" action={<Button variant="soft">See alert settings</Button>}>
              If a flood or drought hits a covered parcel, AiGRI drafts the claim for you.
            </EmptyState>
          </Card>
          <div className="card" aria-busy="true">
            <Skeleton height={20} width="60%" />
            <Skeleton height={48} marginTop={16} />
            <Skeleton height={16} width="80%" marginTop={16} />
            <Skeleton height={16} width="40%" marginTop={8} />
          </div>
          <ErrorState title="Satellite readings didn't load" action={<Button variant="danger" size="sm">Try again</Button>}>
            DMK-05 readings are missing. Your claim is not affected.
          </ErrorState>
        </div>
        {sub("Check list")}
        <Card>
          <CheckList
            items={[
              { tone: "ok", text: "All 5 parcels are inside the policy period." },
              { tone: "need", text: "DMK-05 radar shows no flood. The adjuster will review the photos." },
              { tone: "denied", text: "One photo has no GPS location." },
            ]}
          />
        </Card>
        {sub("Toasts (static, and live buttons)")}
        <div className="stack-sm" style={{ alignItems: "flex-start" }}>
          <ToastView tone="ok" text={`Payout sent to CV Tani Makmur Demak's wallet`} action={{ label: "View", href: "#" }} />
          <ToastView tone="info" text="Copied" />
          <ToastView tone="need" text="Photo needs a retake" />
          <ToastView tone="alert" text="Flood warning for Demak" />
        </div>
        <div className="wrap-row" style={{ marginTop: 16 }}>
          <Button variant="soft" size="sm" onClick={() => toast("Saved.", { tone: "ok" })}>
            Toast ok
          </Button>
          <Button variant="soft" size="sm" onClick={() => toast("Heads up.", { tone: "info", action: { label: "Open", href: "#" } })}>
            Toast with action
          </Button>
          <Button variant="soft" size="sm" onClick={() => toast("Photo needs a retake", { tone: "need" })}>
            Toast needs attention
          </Button>
        </div>
      </section>

      {/* flow */}
      <section className="section" id="k-flow">
        <h2 className="h-section">Stepper, flow and timeline</h2>
        <Flow className="stack" start={2} steps={["Account type", "What you farm", "Business details", "Payout account"]}>
          <Stepper />
          <FlowStep n={1} className="card">
            <h3 className="h-card">Step 1 · Account type</h3>
            <p className="small muted">Agri business.</p>
          </FlowStep>
          <FlowStep n={2} className="card">
            <h3 className="h-card">Step 2 · What you farm</h3>
            <p className="small muted">Crops, livestock or both.</p>
          </FlowStep>
          <FlowStep n={3} className="card">
            <h3 className="h-card">Step 3 · Business details</h3>
            <p className="small muted">Name, NIB and contact.</p>
          </FlowStep>
          <FlowStep n={4} className="card">
            <h3 className="h-card">Step 4 · Payout account</h3>
            <p className="small muted">BCA via {rail}.</p>
          </FlowStep>
          <FlowControls />
        </Flow>
        {sub("Timeline")}
        <Timeline
          progress={0.72}
          items={[
            {
              when: at("2026-02-16T08:20:00"),
              title: "Confirmed and submitted",
              body: (
                <>
                  Ibu Sri Wahyuni · packet <span className="mono">7c41e9…b02d</span>
                </>
              ),
              state: "done",
            },
            {
              when: at("2026-02-19T15:40:00"),
              title: "Info requested",
              body: "\"Please add a ground photo of DMK-05 showing the water line on the plants.\"",
              state: "need",
            },
            { when: at("2026-02-20T07:55:00"), title: "2 photos added and resubmitted", state: "done" },
            { when: at("2026-02-24T14:30:00"), title: "Under review by Dimas Prasetyo", body: `Decision due ${f.date("2026-03-06")}.`, state: "now" },
            { when: "Next", title: "Payout to wallet" },
          ]}
        />
      </section>

      {/* geo */}
      <section className="section" id="k-geo">
        <h2 className="h-section">Maps, satellite, photos, wallet</h2>
        <div className="split">
          <div>
            <MapView
              renderer="schematic"
              ariaLabel="Schematic map of Demak with five parcels"
              bounds={MAP_BOUNDS}
              backdrop={MAP_BACKDROP}
              parcels={KIT_PARCELS.map((p) => ({ id: p.id, geometry: p.geometry, status: p.status, selected: p.selected }))}
              places={[
                { text: "Demak", ...fromFrame(290, 364) },
                { text: "Karanganyar", ...fromFrame(520, 116) },
                { text: "Gajah", ...fromFrame(640, 276) },
              ]}
              onLayers={() => toast("Layer choices open here.", { tone: "info" })}
            />
            <Legend
              style={{ marginTop: 12 }}
              items={[
                { label: "Insured parcel", color: "parcel" },
                { label: "In forecast area", color: "parcel-risk" },
                { label: "Not covered", color: "parcel-off" },
              ]}
            />
            <p className="meta" style={{ marginTop: 4 }}>
              Schematic map. Not to scale.
            </p>
          </div>
          <SelectGroup className="stack-sm" defaultValue="DMK-01" role="group" aria-label="Parcels">
            {KIT_PARCELS.filter((p) => p.pill.text).map((p) => (
              <ParcelTile
                key={p.id}
                value={p.id}
                href="#"
                ring={p.geometry.coordinates[0] ?? []}
                tone={p.status}
                title={p.title}
                meta={`${f.area(p.hectares)} · Inpari 32 · planted ${f.date(p.planted)}`}
                status={<StatusPill tone={p.pill.tone}>{p.pill.text}</StatusPill>}
              />
            ))}
          </SelectGroup>
        </div>

        {sub("Satellite compare (drag, or use the arrow keys)")}
        <SatelliteCompare
          before={<SatScene flooded={false} />}
          after={<SatScene flooded />}
          beforeTag={`Before · ${f.date("2026-02-02")} · Sentinel-1`}
          afterTag={`After · ${f.date("2026-02-08")} · Sentinel-1`}
        />
        <SatReadings
          readings={[
            { label: "Flooded", value: f.pct(92) },
            { label: "Flood duration", value: "9 days" },
            { label: "Crop change (NDVI)", value: `−${f.pct(75)}` },
            { label: "Confidence", value: <StatusPill tone="ok">High</StatusPill> },
          ]}
        />

        {sub("Photos with evidence chips")}
        <PhotoGrid>
          <Photo chip={`${at("2026-02-14T07:12:00")} · ${f.coordinates(-6.8318, 110.7041)}`}>
            <PhotoScene variant="shed" label="Placeholder: cattle at the shed" />
          </Photo>
          <Photo chip="Tag GBG-0485 read">
            <PhotoScene variant="field" label="Placeholder: flooded rice field" />
          </Photo>
        </PhotoGrid>

        <div className="grid-2" style={{ marginTop: 32 }}>
          <div className="stack-sm">
            <Consent
              title={`What you share with ${jsd.name}`}
              hash="a91c3f0e…77e3"
              label={`I agree to share this data with ${jsd.name} for this policy.`}
              defaultChecked
            >
              Your business name and NIB, the 6 parcel boundaries, crops, varieties and planting dates. Nothing else.
            </Consent>
            <Card>
              <div className="txn is-in">
                <span className="txn-icon">
                  <Icon name="arrow-down-left" />
                </span>
                <div>
                  <p className="txn-title">Payout, CLM-26-000418</p>
                  <p className="meta">
                    {at("2026-02-24T14:32:00")} · PAY-26-00318
                  </p>
                </div>
                <span className="txn-amt">{f.moneyMajor(187800000, { sign: true })}</span>
              </div>
              <div className="txn">
                <span className="txn-icon">
                  <Icon name="arrow-up-right" />
                </span>
                <div>
                  <p className="txn-title">Premium, POL-JSD-26-004127</p>
                  <p className="meta">{at("2026-01-10T09:41:00")}</p>
                </div>
                <span className="txn-amt">{f.moneyMajor(-13440000)}</span>
              </div>
            </Card>
          </div>
          <div className="wallet-hero">
            <div className="wh-top">
              <span className="label">Wallet balance</span>
              <SandboxPill />
            </div>
            <CountUp as="p" className="num-xl" to={199360000} format={(v) => m(Math.round(v))} />
            <p className="meta">Available now · {country}</p>
            <div className="wh-actions">
              <Button variant="w" onClick={() => toast("Withdraw opens here.", { tone: "info" })}>
                Withdraw
              </Button>
              <Button variant="ghost">Add funds</Button>
            </div>
            <p className="meta">
              BCA ••••4821 via {rail}
            </p>
          </div>
        </div>
      </section>

      {/* charts */}
      <section className="section" id="k-chart">
        <h2 className="h-section">Charts</h2>
        <div className="grid-2">
          <Card large>
            <h3 className="h-card" style={{ marginBottom: 16 }}>
              Flood chance by parcel
            </h3>
            <BarChart
              aria-label="Flood chance by parcel: DMK-01 31%, DMK-02 28%, DMK-03 24%, DMK-04 19%, DMK-05 14%, DMK-06 6%"
              data={[
                { label: "DMK-01", value: 31, display: f.pct(31), tone: "risk" },
                { label: "DMK-02", value: 28, display: f.pct(28), tone: "risk" },
                { label: "DMK-03", value: 24, display: f.pct(24), tone: "risk" },
                { label: "DMK-04", value: 19, display: f.pct(19) },
                { label: "DMK-05", value: 14, display: f.pct(14) },
                { label: "DMK-06", value: 6, display: f.pct(6) },
              ]}
            />
            <ShowAsTable
              headers={["Parcel", "Flood chance"]}
              rows={[
                ["DMK-01", f.pct(31)],
                ["DMK-02", f.pct(28)],
              ]}
            />
          </Card>
          <Card large>
            <h3 className="h-card" style={{ marginBottom: 16 }}>
              Rain forecast, mm per day
            </h3>
            <LineChart
              aria-label="Rain forecast 9 to 24 January. Highest 40 mm on 17 January. No day above the 50 mm heavy-rain level."
              values={RAIN}
              yMax={50}
              threshold={{ value: 50, label: `${bmkg} heavy-rain level 50 mm/day` }}
              xTicks={[
                { index: 0, label: "9 Jan" },
                { index: 8, label: "17 Jan" },
                { index: 15, label: "24 Jan" },
              ]}
            />
            <p className="meta" style={{ marginTop: 8 }}>
              Highest: {Math.max(...RAIN)} mm on 17 Jan. No day above the heavy-rain level yet.
            </p>
          </Card>
        </div>
      </section>

      {/* overlays */}
      <section className="section" id="k-overlay">
        <h2 className="h-section">Modal, sheet, disclosure</h2>
        <div className="wrap-row">
          <Button variant="ink" onClick={modal.show}>
            Open modal
          </Button>
          <Button variant="soft" onClick={sheet.show}>
            Open sheet
          </Button>
        </div>
        <div className="grid-2" style={{ marginTop: 24 }}>
          <div className="kit-box">
            {sub("Modal (static preview)")}
            <Modal
              preview
              open
              onOpenChange={() => {}}
              title={`Pay ${premium} from your wallet?`}
              footer={
                <>
                  <Button variant="soft">Cancel</Button>
                  <Button variant="ink">Pay now</Button>
                </>
              }
            >
              <p className="muted">{jsd.name} receives the premium and issues your policy straight away.</p>
            </Modal>
          </div>
          <div className="kit-box">
            {sub("Sheet (static preview)")}
            <Sheet preview open onOpenChange={() => {}} title="Clause 4.1" footer={<Button variant="ink">Got it</Button>}>
              <p className="muted">{CLAUSE_TEXT}</p>
            </Sheet>
          </div>
        </div>
        {sub("Disclosure (animated)")}
        <div className="stack-sm" style={{ maxWidth: 820 }}>
          <Disclosure summary="Am I covered if a levee breaks?">
            <p>
              Yes. Flood from river overflow or levee failure is covered when water covers the crop for 3 days or more. <Cite>Clause 4.1</Cite>
            </p>
          </Disclosure>
          <Disclosure summary="Is fire covered?" defaultOpen>
            <p>
              This policy doesn&apos;t say. AiGRI can&apos;t confirm fire cover. <StatusPill tone="pending">Not stated in this policy</StatusPill>
            </p>
          </Disclosure>
          <Disclosure summary="Wrapped automatically">
            <p>The component wraps plain content into the animated body.</p>
          </Disclosure>
        </div>
      </section>

      {/* motion + logo */}
      <section className="section" id="k-motion">
        <h2 className="h-section">Motion and logo</h2>
        <div className="grid-3">
          <Card>
            <p className="label">Sun-rise (72px)</p>
            <div style={{ marginTop: 12 }}>
              <SunRiseMark />
            </div>
          </Card>
          <Card>
            <p className="label">Pop and count-up</p>
            <CountUp as="p" className="num-l" to={187800000} from={0} format={(v) => m(Math.round(v))} style={{ marginTop: 12 }} />
            <p style={{ marginTop: 12 }}>
              <StatusPill tone="ok" pop>
                Approved
              </StatusPill>
            </p>
          </Card>
          <Card tone="ink">
            <p className="label">Reversed logo (on dark)</p>
            <div style={{ marginTop: 12 }}>
              <LogoHorizontal variant="reversed" height={48} />
            </div>
          </Card>
        </div>
        <div className="settle-box" style={{ marginTop: 24, borderRadius: 28, height: 200 }}>
          <Reveal
            as="svg"
            kind="settle"
            viewBox="0 0 1120 200"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label="Placeholder: rice paddy"
            style={{ width: "100%", height: "100%" }}
          >
            <rect width="1120" height="200" fill="#6FA463" />
            <rect y="90" width="1120" height="110" fill="#5D9253" />
            <path d="M0 120C220 100 420 140 640 118S980 100 1120 122V200H0Z" fill="#4E7F45" />
            <circle cx="900" cy="46" r="26" fill="#FFCB3D" />
          </Reveal>
        </div>
        <p className="meta" style={{ marginTop: 8 }}>
          Settle: photo eases from 1.06 to 1 once.
        </p>
      </section>

      {/* icons */}
      <section className="section" id="k-icons">
        <h2 className="h-section">Icons</h2>
        <div id="iconGrid" className="grid-4" style={{ gap: 12 }}>
          {ICON_NAMES.map((n) => (
            <div key={n} className="row" style={{ gap: 10, padding: "10px 12px", borderRadius: 14, background: "var(--surface-2)" }}>
              <Icon name={n} />
              <span className="small">{n}</span>
            </div>
          ))}
        </div>
        <DemoNote />
      </section>

      <Modal
        {...modal.props}
        title={`Pay ${premium} from your wallet?`}
        footer={<ModalFooter onPay={() => toast("Policy issued. POL-JSD-26-004127.", { tone: "ok" })} />}
      >
        <p className="muted">{jsd.name} receives the premium and issues your policy straight away.</p>
      </Modal>
      <Sheet {...sheet.props} title="Clause 4.1" footer={<SheetFooter />}>
        <p className="muted">{CLAUSE_TEXT}</p>
      </Sheet>
    </KitchenSinkFrame>
  );
}

function ModalFooter({ onPay }: { onPay: () => void }) {
  const close = useDialogClose();
  return (
    <>
      <Button variant="soft" onClick={close}>
        Cancel
      </Button>
      <Button
        variant="ink"
        onClick={() => {
          close();
          onPay();
        }}
      >
        Pay now
      </Button>
    </>
  );
}

function SheetFooter() {
  const close = useDialogClose();
  return (
    <Button variant="ink" onClick={close}>
      Got it
    </Button>
  );
}

// Illustrative scenes (the prototype's SVGs). Real satellite tiles and evidence photos come from the backend.
function SatScene({ flooded }: { flooded: boolean }) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="800" height="500" fill="#5D9253" />
      <rect x="0" y="0" width="400" height="250" fill="#6FA463" />
      <rect x="400" y="250" width="400" height="250" fill="#4E7F45" />
      <rect x="0" y="250" width="400" height="250" fill="#7DAF6C" />
      <path d="M0 250H800M400 0V500" stroke="#3E5E34" strokeWidth="2" />
      {flooded ? (
        <>
          <polygon points="150,90 620,90 660,420 180,430" fill="#2F5F86" opacity=".9" />
          <polygon points="170,110 600,100 640,400 200,410" fill="#2F5F86" stroke="#3D6F96" strokeWidth="10" />
          <polygon points="170,110 600,100 640,400 200,410" fill="none" stroke="#fff" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M0 120C200 150 500 90 800 130" stroke="#CFE0EC" strokeWidth="16" fill="none" />
          <polygon points="170,110 600,100 640,400 200,410" fill="none" stroke="#fff" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

function PhotoScene({ variant, label }: { variant: "shed" | "field"; label: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <rect width="400" height="300" fill={variant === "shed" ? "#CFE0EC" : "#6FA463"} />
      <rect y="170" width="400" height="130" fill={variant === "shed" ? "#7DAF6C" : "#2F5F86"} opacity={variant === "shed" ? 1 : 0.8} />
      <rect x="230" y="90" width="120" height="90" fill="#C9CEC6" />
      <polygon points="220,90 290,50 360,90" fill="#6B7766" />
      <circle cx="90" cy="60" r="26" fill="#FFCB3D" />
    </svg>
  );
}

const CLAUSE_TEXT =
  "Flood. Loss or damage to the insured crop caused by inundation from rain, river overflow or levee failure, where water covers the crop for at least 3 consecutive days.";

// Daily rain, mm, 9 to 24 January (illustrative; the peak is 40 on 17 January).
const RAIN = [15, 24, 11, 30, 36, 18, 9, 32, 40, 38, 18, 11, 4, 16, 29, 32];
