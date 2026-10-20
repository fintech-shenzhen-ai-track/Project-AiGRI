"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { bindFormatters, type Formatters } from "./format";
import type { Pack } from "./types";

const PackContext = createContext<Formatters | null>(null);

/** Gives client components the active country pack and its formatters. Mount it once per shell (T-03.15). */
export function PackProvider({ pack, children }: { pack: Pack; children: ReactNode }) {
  const value = useMemo(() => bindFormatters(pack), [pack]);
  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

/** Formatters and pack labels for the active pack. Components never print a symbol, unit or zone label themselves. */
export function useFormat(): Formatters {
  const ctx = useContext(PackContext);
  if (!ctx) throw new Error("useFormat() must be used inside <PackProvider>");
  return ctx;
}

export function usePack(): Pack {
  return useFormat().pack;
}
