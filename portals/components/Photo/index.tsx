import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

/** `.photo-grid`: photos in a responsive grid (one column on a phone). */
export function PhotoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("photo-grid", className)}>{children}</div>;
}

export interface PhotoProps {
  /** Image URL (evidence comes from the Capture Page storage). Leave out and pass `children` for an SVG scene. */
  src?: string;
  alt?: string;
  /** Evidence chip: capture time and place, or "Tag GBG-0485 read". Formatted through the pack by the caller. */
  chip?: ReactNode;
  /** CSS object-position, for example "50% 55%". */
  objectPosition?: string;
  /** An `<svg>` that fills the frame instead of an image. */
  children?: ReactNode;
  className?: string;
}

/** `.photo`: a 4:3 tile with an optional evidence chip. Photos are write-once evidence; this only displays them. */
export function Photo({ src, alt = "", chip, objectPosition, children, className }: PhotoProps) {
  const style: CSSProperties | undefined = objectPosition ? { objectPosition } : undefined;
  return (
    <div className={cx("photo", className)}>
      {src ? (
        // Evidence images are served by the storage layer at arbitrary sizes; next/image would re-encode them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" style={style} />
      ) : (
        children
      )}
      {chip ? <span className="photo-chip">{chip}</span> : null}
    </div>
  );
}
