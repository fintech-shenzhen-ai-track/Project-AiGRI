import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library does not unmount between tests by itself.
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-still");
  document.documentElement.classList.remove("has-dialog");
});

// jsdom has no modal <dialog> behaviour: give it the part the components rely on (open attribute, close event).
if (typeof HTMLDialogElement !== "undefined") {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void };
  if (typeof proto.showModal !== "function") {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (typeof proto.close !== "function") {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
