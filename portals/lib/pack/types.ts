// The country pack as served by GET /api/v1/packs/{code}. Shape: specs/00-shared/schemas/country-pack.schema.json.
// Written by hand from that schema until the packs router is in openapi.json (C03 / T-01.09); then alias to the
// generated schema.

export interface CompactUnit {
  at_least: number;
  suffix: string;
  divide_by: number;
}

export interface PackCurrency {
  code: string;
  symbol: string;
  symbol_spacing?: "none" | "space";
  display_decimals: number;
  minor_unit_exponent: number;
  compact_units?: CompactUnit[];
}

export interface PackTimezone {
  iana: string;
  label: string;
  default?: boolean;
}

export interface Pack {
  code: string;
  name: string;
  status: "live" | "planned";
  live_since?: string;
  currency: PackCurrency;
  locale: string;
  format: {
    decimal: string;
    thousands: string;
    /** Token pattern, for example "D MMM YYYY". */
    date: string;
    /** Token pattern, for example "D MMM YYYY, HH:mm z". */
    datetime: string;
    phone_example?: string;
  };
  area_unit: { code: "ha" | "rai"; label: string; per_hectare: number };
  timezones: PackTimezone[];
  regulator: { short: string; name: string };
  data_law: string;
  payout_rails: string[];
  hazard_sources: { id: string; name: string; kind: string; access?: string }[];
  public_schemes: { code: string; name: string; gloss: string }[];
  regions?: { code: string; name: string; level: "province" | "regency" | "district"; parent?: string }[];
  insurers: { code: string; name: string; initials: string }[];
  setup_steps: { step: string; done: boolean }[];
  alert_loss_probability?: number;
}

/** Money on the wire (api-conventions.md): integer minor units plus the ISO currency code. */
export interface Money {
  amount_minor: number | string;
  currency: string;
}
