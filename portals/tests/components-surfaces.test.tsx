import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card, CardLink } from "@/components/Card";
import { Stat } from "@/components/Stat";
import { Kv } from "@/components/Kv";
import { Meter } from "@/components/Meter";
import { Cite } from "@/components/Cite";
import { PolicyCard } from "@/components/PolicyCard";
import { DemoNote, DEMO_NOTE_TEXT } from "@/components/DemoNote";
import { SandboxPill } from "@/components/SandboxPill";
import { InsMark } from "@/components/InsMark";
import { Avatar, initialsOf } from "@/components/Avatar";
import { Hash, shortHash } from "@/components/Hash";
import { clearToasts, getToasts } from "@/lib/toast";

afterEach(() => {
  clearToasts();
  vi.restoreAllMocks();
});

describe("Card and friends", () => {
  it("maps tone and size to the design system classes", () => {
    const { container } = render(
      <>
        <Card>plain</Card>
        <Card tone="ink" large>
          ink
        </Card>
        <Card tone="w">white</Card>
        <CardLink href="#x">
          <span className="grow">link</span>
        </CardLink>
      </>,
    );
    const cards = container.querySelectorAll(".card");
    expect(cards[0]).toHaveClass("card");
    expect(cards[1]).toHaveClass("card", "card-ink", "card-lg");
    expect(cards[2]).toHaveClass("card", "card-w");
    expect(screen.getByRole("link")).toHaveClass("card", "card-link");
  });

  it("Stat prints label, value, title and meta", () => {
    render(
      <Stat label="Paid" value="412,6 jt" valueTitle="412.600.000" meta="21 payouts">
        <Meter value={0.62} label="62 percent" />
      </Stat>,
    );
    expect(screen.getByText("412,6 jt")).toHaveAttribute("title", "412.600.000");
    expect(screen.getByText("21 payouts")).toHaveClass("meta");
    expect(screen.getByRole("img", { name: "62 percent" }).firstElementChild).toHaveStyle({ "--p": "0.62" });
  });

  it("Meter clamps its fraction", () => {
    const { container } = render(<Meter value={1.7} />);
    expect(container.querySelector(".meter > span")).toHaveStyle({ "--p": "1" });
  });

  it("Kv renders a description list", () => {
    render(<Kv items={[{ label: "Policy", value: "POL-1" }, { label: "Premium", value: "13", meta: "3,5%" }]} />);
    expect(screen.getByText("Policy").tagName).toBe("DT");
    expect(screen.getByText("POL-1").tagName).toBe("DD");
    expect(screen.getByText("3,5%")).toHaveClass("meta");
  });
});

describe("PolicyCard", () => {
  it("renders rank, figures and reasons with clause chips", () => {
    const { container } = render(
      <PolicyCard
        rank={1}
        top
        insurer={{ name: "Insurer X", initials: "IX" }}
        name="Rice Flood Cover"
        badge={<span className="pill pill-ok">Best fit</span>}
        ratio={{ value: "1,46", meta: "expected payout per unit of premium" }}
        figures={[{ label: "Premium", value: "P1", meta: "m" }, { label: "Sum insured", value: "S1" }]}
        whyLabel="Why it ranks here"
        why={[
          { text: "Covers flood", cites: <Cite>Clause 4.1</Cite> },
          { text: "Pays only from 20% loss", minus: true, cites: <Cite>Clause 5.3</Cite> },
        ]}
        actions={<a href="#a">See policy</a>}
      />,
    );
    const art = container.querySelector("article")!;
    expect(art).toHaveClass("policy", "is-top", "rv");
    expect(art.querySelector(".policy-rank")).toHaveTextContent("1");
    expect(art.querySelectorAll(".policy-figures > div")).toHaveLength(2);
    expect(art.querySelectorAll(".policy-why li")).toHaveLength(2);
    expect(art.querySelectorAll(".policy-why li.is-minus")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Clause 4.1" })).toHaveClass("cite");
    expect(art.querySelector(".ins-mark")).toHaveTextContent("IX");
  });

  it("the not-eligible card has no rank and no figures", () => {
    const { container } = render(
      <PolicyCard off insurer={{ name: "Insurer X", initials: "IX" }} name="Scheme cover" status={<span className="pill pill-pending">Not eligible</span>} note="For members only." />,
    );
    expect(container.querySelector(".policy")).toHaveClass("is-off");
    expect(container.querySelector(".policy-rank")).toBeNull();
    expect(container.querySelector(".policy-figures")).toBeNull();
    expect(screen.getByText("Not eligible")).toBeInTheDocument();
  });
});

describe("small marks", () => {
  it("DemoNote defaults to the constitution wording", () => {
    render(<DemoNote />);
    expect(screen.getByText(DEMO_NOTE_TEXT)).toHaveClass("demo-note");
    expect(DEMO_NOTE_TEXT).toBe("Demo data. Products and prices are illustrative.");
  });

  it("SandboxPill, InsMark and Avatar", () => {
    const { container } = render(
      <>
        <SandboxPill />
        <InsMark initials="JS" />
        <Avatar initials="SW" decorative />
      </>,
    );
    expect(screen.getByText("Sandbox")).toHaveClass("sandbox");
    expect(container.querySelector(".ins-mark")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".avatar")).toHaveAttribute("aria-hidden", "true");
  });

  it("initialsOf takes first and last word, skipping an honorific", () => {
    expect(initialsOf("Ibu Sri Wahyuni")).toBe("SW");
    expect(initialsOf("Dimas Prasetyo")).toBe("DP");
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("")).toBe("");
  });
});

describe("Hash", () => {
  it("shortens a digest and copies the full value with a Copied toast", async () => {
    const full = "7c41e9a2b1d3f5a6c8e0b4d2f1a3c5e7090b1d3f5a7c9e0b2d4f6a8c0e1b02d";
    expect(shortHash(full)).toBe("7c41e9…b02d");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Hash value={full} />);
    expect(screen.getByText("7c41e9…b02d", { exact: false })).toHaveAttribute("title", full);
    await userEvent.click(screen.getByRole("button", { name: "Copy 7c41e9…b02d" }));
    expect(writeText).toHaveBeenCalledWith(full);
    await waitFor(() => expect(getToasts().map((t) => t.text)).toContain("Copied"));
  });

  it("can be shown without the copy button", () => {
    render(<Hash value="a91c3f0e…77e3" copy={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
