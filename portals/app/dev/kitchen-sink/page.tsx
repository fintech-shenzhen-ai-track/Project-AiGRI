import type { Metadata } from "next";
import { loadPack } from "@/lib/pack/server";
import { PackProvider } from "@/lib/pack";
import { KitchenSink } from "./KitchenSink";
import "./kitchen-sink.css";

// /dev/kitchen-sink (sandbox only; middleware answers 404 elsewhere). Reproduces
// system-preview/shared/_kitchen-sink.html with the React components. Money, dates, areas and labels come from the
// active country pack, read from the API at request time (so this page is never prerendered).

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kitchen sink · AiGRI" };

export default async function KitchenSinkPage() {
  const pack = await loadPack("ID");
  return (
    <PackProvider pack={pack}>
      <KitchenSink />
    </PackProvider>
  );
}
