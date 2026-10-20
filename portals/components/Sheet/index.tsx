"use client";

import { Dialog, type DialogProps } from "@/components/Dialog";

export { useDialog, useDialogClose } from "@/components/Dialog";

export type SheetProps = Omit<DialogProps, "kind">;

/**
 * `.sheet`: a panel for detail that keeps the page behind it (a clause, a form, a profile). Slides up from the
 * bottom on a phone and in from the right on desktop. Has a close button; Esc and the backdrop also close it.
 */
export function Sheet(props: SheetProps) {
  return <Dialog kind="sheet" {...props} />;
}
