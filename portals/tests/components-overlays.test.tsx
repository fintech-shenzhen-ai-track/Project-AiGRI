import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/Button";
import { Modal, useDialog, useDialogClose } from "@/components/Modal";
import { Sheet } from "@/components/Sheet";
import { ToastRegion, ToastView } from "@/components/Toast";
import { Disclosure } from "@/components/Disclosure";
import { Flow, FlowControls, FlowStep, Stepper } from "@/components/Flow";
import { Timeline } from "@/components/Timeline";
import { IconSprite } from "@/components/icons/sprite";
import { clearToasts, dismissToast, getToasts, toast } from "@/lib/toast";

const still = () => document.documentElement.setAttribute("data-still", "");

function SheetDemo() {
  const d = useDialog();
  return (
    <>
      <Button onClick={d.show}>Open sheet</Button>
      <Sheet {...d.props} title="Clause 4.1" footer={<Button onClick={d.hide}>Got it</Button>}>
        <p>Flood cover text.</p>
        <input aria-label="First field" />
      </Sheet>
    </>
  );
}

describe("Sheet and Modal", () => {
  beforeEach(still);

  it("opens as a native modal dialog, locks scroll, focuses the first field and returns focus when closed", async () => {
    render(
      <>
        <IconSprite />
        <SheetDemo />
      </>,
    );
    const opener = screen.getByRole("button", { name: "Open sheet" });
    const dialog = document.querySelector("dialog.sheet") as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute("open");
    expect(within(dialog).queryByText("Flood cover text.")).toBeNull(); // not mounted while closed

    await userEvent.click(opener);
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveClass("is-open");
    expect(dialog).toHaveAccessibleName("Clause 4.1");
    expect(document.documentElement).toHaveClass("has-dialog");
    expect(screen.getByLabelText("First field")).toHaveFocus();
    expect(within(dialog).getByText("Flood cover text.")).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(document.documentElement).not.toHaveClass("has-dialog");
    expect(opener).toHaveFocus();
  });

  it("Esc (cancel) and a click on the backdrop close it", async () => {
    render(<SheetDemo />);
    const dialog = document.querySelector("dialog.sheet") as HTMLDialogElement;
    await userEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(dialog).toHaveAttribute("open");
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog).not.toHaveAttribute("open");

    await userEvent.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(dialog).toHaveAttribute("open");
    // jsdom has no layout: a click on the dialog element itself at (0,0) is outside its (empty) box.
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog).not.toHaveAttribute("open");
  });

  it("Modal footer buttons can close it with useDialogClose", async () => {
    const onPay = vi.fn();
    function Footer() {
      const close = useDialogClose();
      return (
        <>
          <Button variant="soft" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onPay();
              close();
            }}
          >
            Pay now
          </Button>
        </>
      );
    }
    function Demo() {
      const d = useDialog();
      return (
        <>
          <Button onClick={d.show}>Open modal</Button>
          <Modal {...d.props} title="Pay from your wallet?" footer={<Footer />}>
            <p>The insurer receives the premium.</p>
          </Modal>
        </>
      );
    }
    render(<Demo />);
    const dialog = document.querySelector("dialog.modal") as HTMLDialogElement;
    await userEvent.click(screen.getByRole("button", { name: "Open modal" }));
    expect(dialog).toHaveAttribute("open");
    expect(dialog.querySelector(".sheet-grab")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Pay now" }));
    expect(onPay).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveAttribute("open");
  });

  it("a preview renders in place, already open", () => {
    render(
      <>
        <Modal preview open onOpenChange={() => {}} title="Preview title" />
        <Sheet preview open onOpenChange={() => {}} title="Sheet title" />
      </>,
    );
    const dialogs = document.querySelectorAll("dialog");
    expect(dialogs[0]).toHaveClass("modal", "is-static", "is-open");
    expect(dialogs[1]).toHaveClass("sheet", "is-static", "is-open");
    expect(dialogs[0]).toHaveAttribute("open");
  });
});

describe("toasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearToasts();
  });
  afterEach(() => {
    clearToasts();
    vi.useRealTimers();
  });

  it("shows at most 3 live toasts; the oldest leaves when a fourth arrives", () => {
    still();
    render(<ToastRegion />);
    act(() => {
      toast("one");
      toast("two");
      toast("three");
      toast("four", { tone: "need" });
    });
    expect(screen.queryByText("one")).toBeNull();
    expect(screen.getAllByText(/two|three|four/)).toHaveLength(3);
    expect(screen.getByText("four").closest(".toast")).toHaveAttribute("data-tone", "need");
    expect(screen.getByRole("status")).toHaveClass("toast-region");
  });

  it("goes after 4 s, and a hover pauses the clock", () => {
    still();
    render(<ToastRegion />);
    act(() => {
      toast("Saved.");
    });
    const el = screen.getByText("Saved.").closest(".toast")!;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.mouseEnter(el);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("Saved.")).toBeInTheDocument();
    fireEvent.mouseLeave(el);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText("Saved.")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("Saved.")).toBeNull();
    expect(getToasts()).toHaveLength(0);
  });

  it("an action link and dismissToast work; the exit takes 200 ms outside still mode", () => {
    render(<ToastRegion />);
    let id = 0;
    act(() => {
      id = toast("Heads up.", { tone: "info", duration: 0, action: { label: "Open", href: "/x" } });
    });
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/x");
    act(() => {
      dismissToast(id);
    });
    expect(screen.getByText("Heads up.").closest(".toast")).toHaveClass("out");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText("Heads up.")).toBeNull();
  });

  it("ToastView renders the static markup", () => {
    const { container } = render(
      <>
        <IconSprite />
        <ToastView tone="alert" text="Flood warning for Demak" />
      </>,
    );
    expect(container.querySelector(".toast.in")).toHaveAttribute("data-tone", "alert");
    expect(container.querySelector('use[href="#i-rain-alert"]')).not.toBeNull();
  });
});

describe("Disclosure", () => {
  it("wraps the body in the animated container and toggles", async () => {
    still();
    const { container } = render(
      <Disclosure summary="Is fire covered?">
        <p>This policy doesn&apos;t say.</p>
      </Disclosure>,
    );
    const d = container.querySelector("details.disc") as HTMLDetailsElement;
    expect(d.querySelector(".disc-body > .disc-inner")).not.toBeNull();
    expect(d.open).toBe(false);
    await userEvent.click(screen.getByText("Is fire covered?"));
    expect(d.open).toBe(true);
    await userEvent.click(screen.getByText("Is fire covered?"));
    expect(d.open).toBe(false);
  });

  it("can start open", () => {
    const { container } = render(
      <Disclosure summary="Q" defaultOpen>
        A
      </Disclosure>,
    );
    expect((container.querySelector("details") as HTMLDetailsElement).open).toBe(true);
  });
});

describe("Flow", () => {
  const steps = ["Account type", "What you farm", "Business details", "Payout account"];
  function Demo({ onStepChange }: { onStepChange?: (n: number) => void }) {
    return (
      <Flow steps={steps} start={2} className="stack" onStepChange={onStepChange}>
        <Stepper />
        {steps.map((s, i) => (
          <FlowStep key={s} n={i + 1} className="card">
            <h3 className="h-card">{`Step ${i + 1} · ${s}`}</h3>
          </FlowStep>
        ))}
        <FlowControls />
      </Flow>
    );
  }

  it("starts on the given step and shows its state in the stepper", () => {
    const { container } = render(<Demo />);
    const items = container.querySelectorAll(".step");
    expect(items[0]).toHaveClass("is-done");
    expect(items[1]).toHaveClass("is-now");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[2]).not.toHaveClass("is-done", "is-now");
    expect(container.querySelector(".stepper")).toHaveStyle({ "--n": "4" });
    expect(container.querySelector(".stepper")!.getAttribute("style")).toContain("--p: 0.3333");
    expect(container.querySelector(".sc-text")).toHaveTextContent("Step 2 of 4 · What you farm");
    const panels = container.querySelectorAll("[data-flow-step]");
    expect(panels[1]).toHaveClass("is-active");
    expect(panels[0]).not.toHaveClass("is-active");
  });

  it("Continue and Back move between steps, focus the new heading and report the step", async () => {
    still();
    const onStepChange = vi.fn();
    const { container } = render(<Demo onStepChange={onStepChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onStepChange).toHaveBeenLastCalledWith(3);
    expect(container.querySelectorAll(".step")[2]).toHaveClass("is-now");
    expect(screen.getByRole("heading", { name: "Step 3 · Business details" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(container.querySelectorAll(".step")[0]).toHaveClass("is-now");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull(); // first step
    expect(container.querySelector(".sc-text")).toHaveTextContent("Step 1 of 4 · Account type");
  });
});

describe("Timeline", () => {
  it("maps states to the pin classes and runs the line to the last stateful item", () => {
    const { container } = render(
      <Timeline
        items={[
          { when: "16 Feb", title: "Confirmed", state: "done" },
          { when: "19 Feb", title: "Info requested", body: "Please add a photo.", state: "need" },
          { when: "24 Feb", title: "Under review", state: "now" },
          { when: "Next", title: "Payout to wallet" },
        ]}
      />,
    );
    const items = container.querySelectorAll(".tl-item");
    expect(items[0]).toHaveClass("done");
    expect(items[1]).toHaveClass("is-need");
    expect(items[2]).toHaveClass("is-now");
    expect(items[3]!.className).toBe("tl-item");
    expect(container.querySelector(".tl-body")).toHaveTextContent("Please add a photo.");
    expect(container.querySelector(".tl")!.getAttribute("style")).toContain("--p: 0.6667");
  });

  it("accepts an explicit progress", () => {
    const { container } = render(<Timeline progress={0.72} items={[{ when: "a", title: "b" }]} />);
    expect(container.querySelector(".tl")).toHaveStyle({ "--p": "0.72" });
  });
});
