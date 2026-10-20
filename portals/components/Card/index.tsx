import Link from "next/link";
import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type CardTone = "w" | "ink" | "green" | "cream";

const TONE_CLASS: Record<CardTone, string> = { w: "card-w", ink: "card-ink", green: "card-green", cream: "card-cream" };

interface CardLook {
  /** `w` white on a grey area, `ink` the one decisive item, `green` the wallet balance only, `cream` next step or consent. */
  tone?: CardTone;
  /** 28px radius, 32px padding. */
  large?: boolean;
}

function look({ tone, large }: CardLook, extra?: string, className?: string) {
  return cx("card", tone && TONE_CLASS[tone], large && "card-lg", extra, className);
}

export interface CardProps extends CardLook, HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/** `.card` and its variants. */
export function Card({ tone, large, as: Tag = "div", className, ...rest }: CardProps) {
  return <Tag className={look({ tone, large }, undefined, className)} {...rest} />;
}

export interface CardLinkProps extends CardLook, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

/** The whole card is a link (`.card-link`), with a chevron at the end. Put `<span className="grow">` around the text. */
export function CardLink({ tone, large, href, className, children, ...rest }: CardLinkProps) {
  const cls = look({ tone, large }, "card-link", className);
  return href.startsWith("#") ? (
    <a className={cls} href={href} {...rest}>
      {children}
    </a>
  ) : (
    <Link className={cls} href={href} {...rest}>
      {children}
    </Link>
  );
}
