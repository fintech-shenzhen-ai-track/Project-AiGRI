import type { CompactUnit, Money, Pack } from "./types";

// Pack formatters (FR-03.4). Every output follows DESIGN.md section 11 and must equal the backend's
// `core.packs.fmt` for the same input (shared fixture: specs/01-foundation/format-cases.json).
//
// Rules, from specs/01-foundation/plan.md "Formatters" and decisions D-37 and D-38:
//  - Money is the pack symbol as a prefix (never Intl `style: "currency"`, which inserts a space after "Rp"),
//    digits grouped with the pack's thousands separator, `display_decimals` places, U+2212 for negatives.
//  - Rounding is half-up (away from zero), once, on exact decimal arithmetic. No floating-point rounding.
//  - Nothing here prints a currency symbol, unit, time-zone label or separator that does not come from the pack.

const MINUS = "−";
const EN_DASH = "–";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// ---------------------------------------------------------------------------------------------
// Exact decimals

/** |value| = digits / 10^scale, with a separate sign. */
interface Dec {
  neg: boolean;
  digits: bigint;
  scale: number;
}

export type NumberInput = number | string | bigint;

const pow10 = (n: number): bigint => 10n ** BigInt(n);

function plainNumber(n: number): string {
  if (!Number.isFinite(n)) throw new RangeError(`Cannot format ${n}`);
  const s = String(n);
  return /e/i.test(s) ? n.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 20 }) : s;
}

function parseDec(v: NumberInput): Dec {
  if (typeof v === "bigint") return { neg: v < 0n, digits: v < 0n ? -v : v, scale: 0 };
  const s = typeof v === "number" ? plainNumber(v) : v.trim();
  const m = /^([+-])?(\d*)(?:\.(\d+))?$/.exec(s);
  if (!m || (m[2] === "" && m[3] === undefined)) throw new RangeError(`Not a decimal number: "${s}"`);
  const frac = m[3] ?? "";
  return { neg: m[1] === "-", digits: BigInt(`${m[2] || "0"}${frac}`), scale: frac.length };
}

function withScale(d: Dec, scale: number): Dec {
  return { ...d, digits: d.digits * pow10(scale - d.scale), scale };
}

/** Value divided by 10^places (places may be negative to multiply). */
function shiftDown(d: Dec, places: number): Dec {
  return places >= 0 ? { ...d, scale: d.scale + places } : { ...d, digits: d.digits * pow10(-places) };
}

function mul(a: Dec, b: Dec): Dec {
  return { neg: a.neg !== b.neg, digits: a.digits * b.digits, scale: a.scale + b.scale };
}

/** Round half up (away from zero) to `places` decimal places. */
function roundTo(d: Dec, places: number): Dec {
  if (d.scale <= places) return withScale(d, places);
  const k = pow10(d.scale - places);
  let q = d.digits / k;
  if ((d.digits % k) * 2n >= k) q += 1n;
  return { neg: d.neg, digits: q, scale: places };
}

/** Compare absolute values. */
function cmpAbs(a: Dec, b: Dec): number {
  const s = Math.max(a.scale, b.scale);
  const x = withScale(a, s).digits;
  const y = withScale(b, s).digits;
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Grouped digits of an already-rounded Dec (no sign). `trim` drops trailing zeros and a bare separator. */
function renderDigits(d: Dec, pack: Pack, trim = false): string {
  const base = pow10(d.scale);
  const int = (d.digits / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, pack.format.thousands);
  let frac = d.scale > 0 ? (d.digits % base).toString().padStart(d.scale, "0") : "";
  if (trim) frac = frac.replace(/0+$/, "");
  return frac ? `${int}${pack.format.decimal}${frac}` : int;
}

const isZero = (d: Dec): boolean => d.digits === 0n;

// ---------------------------------------------------------------------------------------------
// Numbers, percent, area

/** Count or decimal number: `1284` -> "1.284"; `(1.46, 2)` -> "1,46". Negative uses U+2212. */
export function num(pack: Pack, value: NumberInput, decimals = 0): string {
  const r = roundTo(parseDec(value), decimals);
  return `${r.neg && !isZero(r) ? MINUS : ""}${renderDigits(r, pack)}`;
}

/** `(3.5, 1)` -> "3,5%"; `92` -> "92%". The input is already a percentage, not a ratio. */
export function pct(pack: Pack, value: NumberInput, decimals = 0): string {
  return `${num(pack, value, decimals)}%`;
}

/** Hectares in, pack area unit out, one decimal: `48` -> "48,0 ha". (Thailand: rai.) */
export function area(pack: Pack, hectares: NumberInput): string {
  const r = roundTo(mul(parseDec(hectares), parseDec(pack.area_unit.per_hectare)), 1);
  return `${r.neg && !isZero(r) ? MINUS : ""}${renderDigits(r, pack)} ${pack.area_unit.label}`;
}

// ---------------------------------------------------------------------------------------------
// Money

export interface MoneyOptions {
  /** Show "+" on positive amounts (ledgers only; negatives always show U+2212). */
  sign?: boolean;
  /** KPI tiles and chart labels only. The full amount belongs in `title` and `aria-label`. */
  compact?: boolean;
}

/**
 * Decimals shown for a compact amount. The pack schema has no field for this; the DESIGN.md examples
 * (`Rp187,8 jt`, `Rp1,24 M`) and the prototype use one decimal below a billion and two from a billion.
 * Open question for C02/01: put `decimals` on `compact_units` and read it here.
 */
function compactDecimals(unit: CompactUnit): number {
  return unit.divide_by >= 1_000_000_000 ? 2 : 1;
}

function powerOfTenExponent(n: number): number {
  const e = Math.round(Math.log10(n));
  if (!(n > 0) || 10 ** e !== n) throw new RangeError(`compact unit divide_by must be a power of ten, got ${n}`);
  return e;
}

function symbolPrefix(pack: Pack): string {
  return pack.currency.symbol_spacing === "space" ? `${pack.currency.symbol} ` : pack.currency.symbol;
}

function formatMajor(pack: Pack, major: Dec, opts: MoneyOptions): string {
  const cur = pack.currency;
  let body: string | null = null;
  let rounded: Dec = roundTo(major, cur.display_decimals);

  if (opts.compact && cur.compact_units?.length) {
    const unit = [...cur.compact_units].sort((a, b) => b.at_least - a.at_least).find((u) => cmpAbs(major, parseDec(u.at_least)) >= 0);
    if (unit) {
      const r = roundTo(shiftDown(major, powerOfTenExponent(unit.divide_by)), compactDecimals(unit));
      rounded = r;
      body = `${symbolPrefix(pack)}${renderDigits(r, pack, true)}${unit.suffix}`;
    }
  }
  body ??= `${symbolPrefix(pack)}${renderDigits(rounded, pack)}`;

  if (isZero(rounded)) return body;
  if (major.neg) return `${MINUS}${body}`;
  return opts.sign ? `+${body}` : body;
}

/**
 * API money (`{amount_minor, currency}`) in the pack's currency: `6000000` IDR -> "Rp6.000.000".
 * The currency must be the pack's (policy currency is fixed on the policy; converting for display is
 * labelled "approx." and is not done here), otherwise this throws.
 */
export function money(pack: Pack, amount: Money, opts: MoneyOptions = {}): string {
  if (amount.currency !== pack.currency.code) {
    throw new RangeError(`Cannot format ${amount.currency} with the ${pack.code} pack (${pack.currency.code})`);
  }
  const minor = parseDec(typeof amount.amount_minor === "number" ? String(amount.amount_minor) : amount.amount_minor);
  return formatMajor(pack, shiftDown(minor, pack.currency.minor_unit_exponent), opts);
}

/** An amount already in major units (what the animation passes to count-up, for example). */
export function moneyMajor(pack: Pack, major: NumberInput, opts: MoneyOptions = {}): string {
  return formatMajor(pack, parseDec(major), opts);
}

/**
 * Rates: `Rp280.000/ha`, `Rp200.000/head/year`. Pass `"area"` to use the pack's area unit label;
 * any other string is appended as written.
 */
export function rate(pack: Pack, amount: Money, per: "area" | (string & {})): string {
  return `${money(pack, amount)}/${per === "area" ? pack.area_unit.label : per}`;
}

// ---------------------------------------------------------------------------------------------
// Dates and times

interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  /** False for a date-only input: no time, no zone. */
  hasTime: boolean;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

function defaultZone(pack: Pack) {
  return pack.timezones.find((t) => t.default) ?? pack.timezones[0];
}

function zoneLabel(pack: Pack, iana?: string): string {
  const z = iana ? pack.timezones.find((t) => t.iana === iana) : defaultZone(pack);
  return z?.label ?? iana ?? defaultZone(pack)?.label ?? "";
}

function partsInZone(instant: Date, iana: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: iana,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const get = (type: string) => Number(f.formatToParts(instant).find((p) => p.type === type)?.value);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second"), hasTime: true };
}

/**
 * ISO date -> calendar parts as written. ISO instant (Z or offset) or Date -> wall clock in the pack's time zone
 * (or `timeZone`). A time without a zone is read as wall-clock time in the pack zone, as the prototype does.
 */
function toParts(pack: Pack, input: string | Date, timeZone?: string): Parts {
  const iana = timeZone ?? defaultZone(pack)?.iana ?? "UTC";
  if (input instanceof Date) return partsInZone(input, iana);
  const s = input.trim();
  const dm = DATE_ONLY.exec(s);
  if (dm) return { y: +dm[1]!, mo: +dm[2]!, d: +dm[3]!, h: 0, mi: 0, s: 0, hasTime: false };
  const nm = NAIVE.exec(s);
  if (nm) return { y: +nm[1]!, mo: +nm[2]!, d: +nm[3]!, h: +nm[4]!, mi: +nm[5]!, s: +(nm[6] ?? 0), hasTime: true };
  if (HAS_ZONE.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(t.getTime())) return partsInZone(t, iana);
  }
  throw new RangeError(`Not an ISO date or time: "${input}"`);
}

const two = (n: number) => String(n).padStart(2, "0");

/** Expand a pack pattern. Tokens: YYYY, MMM, MM, DD, D, HH, mm, ss, z (zone label). */
function applyPattern(pattern: string, p: Parts, label: string): string {
  return pattern.replace(/YYYY|MMM|MM|DD|D|HH|mm|ss|z/g, (tok) => {
    switch (tok) {
      case "YYYY":
        return String(p.y);
      case "MMM":
        return MONTHS[p.mo - 1] ?? "";
      case "MM":
        return two(p.mo);
      case "DD":
        return two(p.d);
      case "D":
        return String(p.d);
      case "HH":
        return two(p.h);
      case "mm":
        return two(p.mi);
      case "ss":
        return two(p.s);
      default:
        return label;
    }
  });
}

/** "16 Feb 2026". Never 16/02/2026. */
export function date(pack: Pack, input: string | Date, timeZone?: string): string {
  return applyPattern(pack.format.date, toParts(pack, input, timeZone), "");
}

/** "16 Feb 2026, 08:20 WIB": 24-hour clock plus the pack's time zone label. A date-only input gives just the date. */
export function dateTime(pack: Pack, input: string | Date, timeZone?: string): string {
  const p = toParts(pack, input, timeZone);
  return p.hasTime ? applyPattern(pack.format.datetime, p, zoneLabel(pack, timeZone)) : applyPattern(pack.format.date, p, "");
}

/** Audit Log time, ISO-style: "2026-02-16 08:20:11 WIB". */
export function auditTime(pack: Pack, input: string | Date, timeZone?: string): string {
  const p = toParts(pack, input, timeZone);
  return `${p.y}-${two(p.mo)}-${two(p.d)} ${two(p.h)}:${two(p.mi)}:${two(p.s)} ${zoneLabel(pack, timeZone)}`;
}

/**
 * Ranges with an en dash: "6–8 Feb 2026", "1 Jan – 30 Apr 2026", "28 Dec 2025 – 3 Jan 2026".
 * Assumes the pack writes dates day, month, year (every current pack does).
 */
export function range(pack: Pack, start: string | Date, end: string | Date, timeZone?: string): string {
  const a = toParts(pack, start, timeZone);
  const b = toParts(pack, end, timeZone);
  const mon = (p: Parts) => MONTHS[p.mo - 1] ?? "";
  if (a.y === b.y && a.mo === b.mo && a.d === b.d) return date(pack, start, timeZone);
  if (a.y === b.y && a.mo === b.mo) return `${a.d}${EN_DASH}${b.d} ${mon(b)} ${b.y}`;
  if (a.y === b.y) return `${a.d} ${mon(a)} ${EN_DASH} ${b.d} ${mon(b)} ${b.y}`;
  return `${date(pack, start, timeZone)} ${EN_DASH} ${date(pack, end, timeZone)}`;
}

/**
 * "2 h ago", only under 24 hours; `null` after that (show the date instead). Always pair it with the absolute
 * time in `title`. `now` comes from the story clock, never from the device.
 */
export function relative(pack: Pack, instant: string | Date, now: string | Date): string | null {
  void pack;
  const t = (instant instanceof Date ? instant : new Date(instant)).getTime();
  const n = (now instanceof Date ? now : new Date(now)).getTime();
  if (Number.isNaN(t) || Number.isNaN(n)) throw new RangeError("relative(): invalid date");
  const ms = n - t;
  if (ms < 0 || ms >= 24 * 3_600_000) return null;
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  return `${Math.floor(ms / 3_600_000)} h ago`;
}

// ---------------------------------------------------------------------------------------------
// Coordinates and phone

/** Decimal degrees, 4 places, U+2212 for negatives. Coordinates keep a decimal point in every pack. */
export function coordinates(lat: NumberInput, lon: NumberInput): string {
  const one = (v: NumberInput) => {
    const r = roundTo(parseDec(v), 4);
    const base = pow10(4);
    const text = `${(r.digits / base).toString()}.${(r.digits % base).toString().padStart(4, "0")}`;
    return `${r.neg && !isZero(r) ? MINUS : ""}${text}`;
  };
  return `${one(lat)}, ${one(lon)}`;
}

/**
 * Phone number grouped like the pack's `phone_example` ("+62 812-2741-0938": dial code, then 3-4-4).
 * Accepts "+6281227410938", "081227410938" or an already formatted number. Unknown shapes come back trimmed.
 */
export function phone(pack: Pack, input: string): string {
  const example = pack.format.phone_example;
  const m = example ? /^(\+\d+)\s+(.+)$/.exec(example) : null;
  if (!m) return input.trim();
  const dial = m[1]!;
  const groups = m[2]!.split(/[-\s]/).map((g) => g.length);
  const sep = /-/.test(m[2]!) ? "-" : " ";
  let digits = input.replace(/\D/g, "");
  const dialDigits = dial.slice(1);
  if (digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length < groups.reduce((a, b) => a + b, 0)) return input.trim();
  const out: string[] = [];
  let at = 0;
  groups.forEach((len, i) => {
    out.push(i === groups.length - 1 ? digits.slice(at) : digits.slice(at, at + len));
    at += len;
  });
  return `${dial} ${out.join(sep)}`;
}

/** All formatters bound to one pack; what `useFormat()` returns. */
export function bindFormatters(pack: Pack) {
  return {
    pack,
    num: (v: NumberInput, decimals?: number) => num(pack, v, decimals),
    pct: (v: NumberInput, decimals?: number) => pct(pack, v, decimals),
    area: (hectares: NumberInput) => area(pack, hectares),
    money: (amount: Money, opts?: MoneyOptions) => money(pack, amount, opts),
    moneyMajor: (major: NumberInput, opts?: MoneyOptions) => moneyMajor(pack, major, opts),
    rate: (amount: Money, per: "area" | (string & {})) => rate(pack, amount, per),
    date: (input: string | Date, timeZone?: string) => date(pack, input, timeZone),
    dateTime: (input: string | Date, timeZone?: string) => dateTime(pack, input, timeZone),
    auditTime: (input: string | Date, timeZone?: string) => auditTime(pack, input, timeZone),
    range: (start: string | Date, end: string | Date, timeZone?: string) => range(pack, start, end, timeZone),
    relative: (instant: string | Date, now: string | Date) => relative(pack, instant, now),
    coordinates,
    phone: (input: string) => phone(pack, input),
    /** Pack labels components may print (they never hard-code these). */
    labels: {
      areaUnit: pack.area_unit.label,
      currencyCode: pack.currency.code,
      timeZone: zoneLabel(pack),
      regulator: pack.regulator.short,
      payoutRails: pack.payout_rails,
    },
  };
}

export type Formatters = ReturnType<typeof bindFormatters>;
