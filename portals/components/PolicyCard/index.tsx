import type { ReactNode } from "react";
import { Icon } from "@/components/icons/sprite";
import { InsMark } from "@/components/InsMark";
import { Reveal } from "@/components/Reveal";
import { cx } from "@/lib/cx";

export interface PolicyFigure {
  label: ReactNode;
  /** Formatted through the pack. */
  value: ReactNode;
  meta?: ReactNode;
}

export interface PolicyReason {
  text: ReactNode;
  /** One or more `<Cite>` chips. A reason without a clause chip should say "Not stated in this policy" instead. */
  cites?: ReactNode;
  /** A drawback (grey minus) rather than a plus. Never colour alone: the icon differs too. */
  minus?: boolean;
}

export interface PolicyCardProps {
  rank?: number;
  /** Rank 1: cream background. */
  top?: boolean;
  /** Not eligible: greyed, no rank, no figures. */
  off?: boolean;
  insurer: { name: string; initials: string };
  name: string;
  /** A pill under the name, for example "Best fit for your risk". */
  badge?: ReactNode;
  /** The ranking ratio, for example `{ value: "1,46", meta: "expected payout per Rp1 of premium" }`, formatted by the caller. */
  ratio?: { value: ReactNode; meta: ReactNode };
  /** Right-hand status when `off` (a pill). */
  status?: ReactNode;
  figures?: PolicyFigure[];
  /** Heading above the reasons ("Why it ranks here"); only the top card shows one in the prototype. */
  whyLabel?: ReactNode;
  why?: PolicyReason[];
  /** Explanatory paragraph, used by the not-eligible card. */
  note?: ReactNode;
  actions?: ReactNode;
  /** Stagger index for the reveal. */
  i?: number;
}

/** `.policy`: one ranked Product. Money and ratios arrive formatted; this component prints no currency symbol. */
export function PolicyCard({ rank, top, off, insurer, name, badge, ratio, status, figures, whyLabel, why, note, actions, i }: PolicyCardProps) {
  return (
    <Reveal as="article" className={cx("policy", top && "is-top", off && "is-off")} i={i}>
      {rank !== undefined && !off ? <span className="policy-rank">{rank}</span> : null}
      <div className="policy-head">
        <div>
          <div className="policy-insurer">
            <InsMark initials={insurer.initials} />
            {insurer.name}
          </div>
          <h3 className="policy-name">{name}</h3>
          {badge ? <p style={{ marginTop: 12 }}>{badge}</p> : null}
        </div>
        {ratio ? (
          <div className="policy-ratio">
            <div className="num-l">{ratio.value}</div>
            <p className="meta">{ratio.meta}</p>
          </div>
        ) : null}
        {status}
      </div>
      {note ? <p className="small">{note}</p> : null}
      {figures?.length ? (
        <div className="policy-figures">
          {figures.map((f, k) => (
            <div key={k}>
              <p className="label">{f.label}</p>
              <p className="fig">{f.value}</p>
              {f.meta ? <p className="meta">{f.meta}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {why?.length ? (
        whyLabel ? (
          <div>
            <p className="label" style={{ marginBottom: 12 }}>
              {whyLabel}
            </p>
            <WhyList why={why} />
          </div>
        ) : (
          <WhyList why={why} />
        )
      ) : null}
      {actions ? <div className="policy-actions">{actions}</div> : null}
    </Reveal>
  );
}

function WhyList({ why }: { why: PolicyReason[] }) {
  return (
    <ul className="policy-why">
      {why.map((r, k) => (
        <li key={k} className={r.minus ? "is-minus" : undefined}>
          <Icon name={r.minus ? "minus" : "check"} size="sm" />
          <span>{r.text}</span>
          {r.cites}
        </li>
      ))}
    </ul>
  );
}
