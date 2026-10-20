"use client";

import { Dialog, type DialogProps } from "@/components/Dialog";

export { useDialog, useDialogClose } from "@/components/Dialog";

export type ModalProps = Omit<DialogProps, "kind" | "closeLabel">;

/**
 * `.modal`: a centred dialog for a decision that needs a yes or no (for example "Pay from your wallet?").
 * On a phone it becomes a bottom sheet. Esc, the backdrop and Cancel close it; focus returns to the opener.
 */
export function Modal(props: ModalProps) {
  return <Dialog kind="modal" {...props} />;
}
