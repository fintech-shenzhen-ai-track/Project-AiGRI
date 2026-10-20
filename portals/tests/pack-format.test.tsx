import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import * as fmt from "@/lib/pack/format";
import { PackProvider, useFormat } from "@/lib/pack";
import type { Pack } from "@/lib/pack/types";

const root = path.resolve(import.meta.dirname, "../..");
const loadPack = (code: string) => parse(readFileSync(path.join(root, "packs", `${code}.yaml`), "utf8")) as Pack;
const PACKS: Record<string, Pack> = { ID: loadPack("ID"), PH: loadPack("PH"), VN: loadPack("VN"), TH: loadPack("TH") };

// The cases file. STAND-IN until contract C02 (specs/01-foundation/format-cases.json, T-01.10) is merged: then
// point this at the real file and adapt `FUNCS` if its shape differs. See the note inside the fixture.
const cases = JSON.parse(readFileSync(path.join(import.meta.dirname, "fixtures/format-cases.standin.json"), "utf8")) as {
  cases: { id: string; kind: string; pack: string; args: unknown[]; expected: string | null }[];
};

type AnyFn = (pack: Pack, ...args: never[]) => unknown;
const FUNCS: Record<string, AnyFn> = {
  money: fmt.money as AnyFn,
  moneyMajor: fmt.moneyMajor as AnyFn,
  rate: fmt.rate as AnyFn,
  num: fmt.num as AnyFn,
  pct: fmt.pct as AnyFn,
  area: fmt.area as AnyFn,
  date: fmt.date as AnyFn,
  dateTime: fmt.dateTime as AnyFn,
  auditTime: fmt.auditTime as AnyFn,
  range: fmt.range as AnyFn,
  relative: fmt.relative as AnyFn,
  coordinates: ((_pack: Pack, ...a: never[]) => (fmt.coordinates as (...x: unknown[]) => unknown)(...a)) as AnyFn,
  phone: fmt.phone as AnyFn,
};

describe("format cases (stand-in for specs/01-foundation/format-cases.json)", () => {
  it("has at least 30 cases across the kinds in DESIGN.md section 11", () => {
    expect(cases.cases.length).toBeGreaterThanOrEqual(30);
    const kinds = new Set(cases.cases.map((c) => c.kind));
    for (const k of ["money", "rate", "pct", "num", "area", "date", "dateTime", "range", "relative", "auditTime", "coordinates", "phone"]) {
      expect(kinds, k).toContain(k);
    }
  });

  it.each(cases.cases.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    const fn = FUNCS[c.kind];
    expect(fn, `no formatter for kind ${c.kind}`).toBeDefined();
    const pack = PACKS[c.pack];
    expect(pack, `no pack ${c.pack}`).toBeDefined();
    expect((fn as (...a: unknown[]) => unknown)(pack, ...c.args)).toBe(c.expected);
  });
});

describe("money properties", () => {
  const ID = PACKS.ID!;
  const idr = (n: number) => ({ amount_minor: n, currency: "IDR" });

  it("digits round-trip: stripping the symbol and separators gives the amount back, for many magnitudes", () => {
    let seed = 12345;
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    for (let i = 0; i < 500; i++) {
      const n = next() * (i % 7 === 0 ? 1000 : 1);
      const out = fmt.money(ID, idr(n));
      expect(out.startsWith("Rp")).toBe(true);
      expect(Number(out.slice(2).replaceAll(".", ""))).toBe(n);
      const neg = fmt.money(ID, idr(-n));
      expect(neg).toBe(n === 0 ? out : `−${out}`);
    }
  });

  it("never inserts a space after the symbol and groups by three", () => {
    expect(fmt.money(ID, idr(1234567890))).toBe("Rp1.234.567.890");
    expect(fmt.money(ID, idr(999))).toBe("Rp999");
    expect(fmt.money(ID, idr(1000))).toBe("Rp1.000");
  });

  it("handles amounts beyond 2^53 exactly (string minor units)", () => {
    expect(fmt.money(ID, { amount_minor: "9007199254740993", currency: "IDR" })).toBe("Rp9.007.199.254.740.993");
  });

  it("refuses to format another currency with this pack", () => {
    expect(() => fmt.money(ID, { amount_minor: 100, currency: "PHP" })).toThrow(/Cannot format PHP/);
  });

  it("rounds half up once per value (D-37)", () => {
    expect(fmt.moneyMajor(ID, "0.5")).toBe("Rp1");
    expect(fmt.moneyMajor(ID, "1.4999")).toBe("Rp1");
    expect(fmt.moneyMajor(PACKS.PH!, "0.125")).toBe("₱0.13");
    expect(fmt.moneyMajor(ID, "-0.4")).toBe("Rp0");
  });

  it("uses the symbol spacing the pack declares", () => {
    const spaced: Pack = { ...ID, currency: { ...ID.currency, symbol: "X", symbol_spacing: "space" } };
    expect(fmt.moneyMajor(spaced, 5)).toBe("X 5");
  });

  it("follows the pack's compact units, not constants", () => {
    const custom: Pack = { ...ID, currency: { ...ID.currency, compact_units: [{ at_least: 1000, suffix: " k", divide_by: 1000 }] } };
    expect(fmt.moneyMajor(custom, 2500, { compact: true })).toBe("Rp2,5 k");
    expect(fmt.moneyMajor(custom, 999, { compact: true })).toBe("Rp999");
    expect(fmt.moneyMajor(PACKS.PH!, 5_000_000, { compact: true })).toBe("₱5,000,000.00");
  });
});

describe("dates", () => {
  const ID = PACKS.ID!;
  it("rejects strings that are not ISO", () => {
    expect(() => fmt.date(ID, "16/02/2026")).toThrow(RangeError);
    expect(() => fmt.dateTime(ID, "2026-02-16T08:20:00")).not.toThrow();
  });
  it("accepts Date objects", () => {
    expect(fmt.dateTime(ID, new Date("2026-02-16T01:20:00Z"))).toBe("16 Feb 2026, 08:20 WIB");
  });
  it("reads the pack's patterns", () => {
    const iso: Pack = { ...ID, format: { ...ID.format, date: "YYYY-MM-DD", datetime: "DD MMM YYYY HH:mm:ss z" } };
    expect(fmt.date(iso, "2026-02-16")).toBe("2026-02-16");
    expect(fmt.dateTime(iso, "2026-02-16T01:20:11Z")).toBe("16 Feb 2026 08:20:11 WIB");
  });
});

describe("PackProvider and useFormat", () => {
  function Probe() {
    const f = useFormat();
    return (
      <p>
        {f.moneyMajor(187800000, { compact: true })} | {f.area(48)} | {f.labels.timeZone} | {f.labels.regulator}
      </p>
    );
  }

  it("gives components the formatters and labels of the active pack", () => {
    render(
      <PackProvider pack={PACKS.ID!}>
        <Probe />
      </PackProvider>,
    );
    expect(screen.getByText("Rp187,8 jt | 48,0 ha | WIB | OJK")).toBeInTheDocument();
  });

  it("switching the pack switches every label (no hard-coded values)", () => {
    render(
      <PackProvider pack={PACKS.TH!}>
        <Probe />
      </PackProvider>,
    );
    expect(screen.getByText(/300\.0 rai \| ICT \| OIC/)).toBeInTheDocument();
  });

  it("throws outside a provider", () => {
    expect(() => render(<Probe />)).toThrow(/PackProvider/);
  });
});
