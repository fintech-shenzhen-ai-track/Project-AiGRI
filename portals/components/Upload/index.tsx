"use client";

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";
import { Meter } from "@/components/Meter";
import { cx } from "@/lib/cx";

export interface UploadProps {
  title: ReactNode;
  hint?: ReactNode;
  icon?: IconName;
  accept?: string;
  multiple?: boolean;
  /** Called with the chosen or dropped files. */
  onFiles?: (files: File[]) => void;
  /** While a file is uploading: its fraction 0..1. Shows the meter and the text in `progressText`. */
  progress?: number;
  progressText?: ReactNode;
  /** Force the drag-over look (kitchen sink). */
  over?: boolean;
  disabled?: boolean;
}

/**
 * `.upload`: drop zone and file picker. A click anywhere in the zone opens the picker, a keyboard user reaches the
 * visually hidden file input (the zone shows the focus ring), and files can be dropped.
 * Evidence photos do not go through here (Constitution V: the Capture Page only).
 */
export function Upload({ title, hint, icon = "upload", accept, multiple, onFiles, progress, progressText, over, disabled }: UploadProps) {
  const titleId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const uploading = progress !== undefined;

  const stop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cx("upload", (over || dragging) && "is-over")}
      onClick={(e) => {
        if (!disabled && e.target !== input.current) input.current?.click();
      }}
      onDragEnter={(e) => {
        stop(e);
        if (!disabled) setDragging(true);
      }}
      onDragOver={stop}
      onDragLeave={(e) => {
        stop(e);
        setDragging(false);
      }}
      onDrop={(e) => {
        stop(e);
        setDragging(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles?.(multiple ? files : files.slice(0, 1));
      }}
    >
      <input
        ref={input}
        className="sr"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-labelledby={titleId}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles?.(files);
          e.target.value = "";
        }}
      />
      <span className="ico-dot" style={{ background: "var(--white)" }}>
        <Icon name={uploading ? "image" : icon} />
      </span>
      <p className="h-card" id={titleId}>
        {title}
      </p>
      {uploading ? (
        <>
          <Meter value={progress} />
          {progressText ? <p className="small">{progressText}</p> : null}
        </>
      ) : hint ? (
        <p className="small">{hint}</p>
      ) : null}
    </div>
  );
}
