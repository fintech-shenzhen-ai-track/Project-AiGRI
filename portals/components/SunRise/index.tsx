"use client";

import { LogoSymbol } from "@/components/logo";
import { useReveal } from "@/lib/motion/use-reveal";

/**
 * The AiGRI symbol with the sun-rise reveal: the rows rise one after the other, then the sun comes up (900 ms).
 * For moments that matter (sign-in, a policy issued, a payout), 72px. Plays once when first seen; with reduced
 * motion or still mode it just fades in.
 */
export function SunRiseMark({ size = 72, title = "AiGRI symbol" }: { size?: number; title?: string }) {
  const [ref, seen] = useReveal<SVGSVGElement>();
  return <LogoSymbol ref={ref} size={size} sunRise className={seen ? "in" : undefined} title={title} />;
}
