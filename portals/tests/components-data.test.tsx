import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { DataTable, Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import { StatusPill } from "@/components/StatusPill";
import { Tabs } from "@/components/Tabs";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { CheckList } from "@/components/CheckList";
import { IconSprite } from "@/components/icons/sprite";

beforeEach(() => push.mockClear());

describe("Table", () => {
  const demo = (
    <Table aria-label="Claims">
      <THead>
        <tr>
          <Th>Claim</Th>
          <Th right>Proposed</Th>
        </tr>
      </THead>
      <TBody>
        <Tr href="/insurer/claims/CLM-1">
          <Td ident label="Claim">
            CLM-1
          </Td>
          <Td num label="Proposed">
            74
          </Td>
        </Tr>
        <Tr selected>
          <Td label="Claim">CLM-2</Td>
          <Td num label="Proposed">
            190
          </Td>
        </Tr>
        <Tr flagged>
          <Td label="Claim">CLM-3</Td>
          <Td num label="Proposed">
            20
          </Td>
        </Tr>
      </TBody>
    </Table>
  );

  it("renders stack mode, column labels, selected and flagged rows", () => {
    const { container } = render(demo);
    expect(container.querySelector(".table-wrap > table")).toHaveClass("table", "table-stack");
    expect(screen.getByRole("table", { name: "Claims" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Proposed" })).toHaveClass("r");
    expect(screen.getByText("CLM-1")).toHaveClass("id");
    expect(screen.getByText("CLM-1")).toHaveAttribute("data-l", "Claim");
    expect(screen.getByText("190")).toHaveClass("num");
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[1]).toHaveClass("is-sel");
    expect(rows[2]).toHaveClass("is-flag");
  });

  it("stack mode can be turned off", () => {
    const { container } = render(
      <Table stack={false}>
        <TBody>
          <tr>
            <td>x</td>
          </tr>
        </TBody>
      </Table>,
    );
    expect(container.querySelector("table")).not.toHaveClass("table-stack");
  });

  it("a clickable row navigates on click and Enter, but not when a control inside is clicked", async () => {
    render(
      <Table>
        <TBody>
          <Tr href="/insurer/claims/CLM-1">
            <Td>CLM-1</Td>
            <Td>
              <button type="button">Menu</button>
            </Td>
          </Tr>
        </TBody>
      </Table>,
    );
    const row = screen.getByText("CLM-1").closest("tr")!;
    expect(row).toHaveAttribute("data-href", "/insurer/claims/CLM-1");
    expect(row).toHaveAttribute("tabindex", "0");
    await userEvent.click(screen.getByText("CLM-1"));
    expect(push).toHaveBeenCalledWith("/insurer/claims/CLM-1");
    push.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(push).not.toHaveBeenCalled();
    row.focus();
    await userEvent.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/insurer/claims/CLM-1");
  });

  it("DataTable builds rows from columns", () => {
    render(
      <DataTable
        aria-label="Claims"
        columns={[
          { key: "id", header: "Claim", ident: true },
          { key: "amount", header: "Proposed", align: "right", render: (r: { id: string; amount: string }) => `A ${r.amount}` },
        ]}
        rows={[
          { id: "CLM-9", amount: "5" },
          { id: "CLM-10", amount: "6" },
        ]}
        rowKey={(r) => r.id}
        rowHref={(r) => `/c/${r.id}`}
        isFlagged={(r) => r.id === "CLM-10"}
      />,
    );
    expect(screen.getByText("A 5")).toHaveClass("num");
    expect(screen.getByText("A 5")).toHaveAttribute("data-l", "Proposed");
    expect(screen.getByText("CLM-10").closest("tr")).toHaveClass("is-flag");
    expect(screen.getByText("CLM-9").closest("tr")).toHaveAttribute("data-href", "/c/CLM-9");
  });
});

describe("StatusPill", () => {
  it("maps tone to the pill class and can carry an icon", () => {
    const { container } = render(
      <>
        <IconSprite />
        <StatusPill tone="ok">Approved</StatusPill>
        <StatusPill tone="info" icon="file-pen">
          Drafted
        </StatusPill>
        <StatusPill>Waiting</StatusPill>
        <StatusPill tone="ok" pop delay={200}>
          Paid
        </StatusPill>
      </>,
    );
    expect(screen.getByText("Approved")).toHaveClass("pill", "pill-ok");
    expect(screen.getByText("Waiting")).toHaveClass("pill", "pill-pending");
    expect(container.querySelector('.pill-info use[href="#i-file-pen"]')).not.toBeNull();
    expect(screen.getByText("Paid")).toHaveClass("pill", "pop");
    expect(screen.getByText("Paid")).toHaveStyle({ "--d": "200ms" });
  });
});

describe("Tabs", () => {
  const tabs = [
    { id: "all", label: "All", badge: 59, panel: <p>All panel</p> },
    { id: "open", label: "Open", badge: 41, panel: <p>Open panel</p> },
    { id: "info", label: "Info requested", badge: 5, badgeTone: "need" as const, panel: <p>Info panel</p> },
  ];

  it("shows the selected panel and links tabs to panels", async () => {
    render(<Tabs tabs={tabs} aria-label="Claims" />);
    const all = screen.getByRole("tab", { name: /^All/ });
    expect(all).toHaveAttribute("aria-selected", "true");
    expect(all).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /^Open/ })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("All panel")).toBeVisible();
    expect(screen.getByText("Open panel").parentElement).toHaveAttribute("hidden");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(/All/);
    expect(screen.getByText("5")).toHaveClass("nav-badge", "is-need");

    await userEvent.click(screen.getByRole("tab", { name: /^Open/ }));
    expect(screen.getByRole("tab", { name: /^Open/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Open panel")).toBeVisible();
    expect(screen.getByText("All panel").parentElement).toHaveAttribute("hidden");
  });

  it("moves with arrow keys, Home and End, wrapping around", async () => {
    render(<Tabs tabs={tabs} aria-label="Claims" />);
    screen.getByRole("tab", { name: /^All/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /^Open/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /^Info/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /^All/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: /^Info/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: /^All/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /^All/ })).toHaveFocus();
  });

  it("is controllable and reports changes; tabs without a panel have no aria-controls", async () => {
    const onValueChange = vi.fn();
    render(<Tabs aria-label="Filter" tabs={[{ id: "a", label: "A" }, { id: "b", label: "B" }]} value="a" onValueChange={onValueChange} />);
    expect(screen.getByRole("tab", { name: "A" })).not.toHaveAttribute("aria-controls");
    await userEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("feedback", () => {
  it("Banner uses the tone class, a default icon, text and actions", () => {
    const { container } = render(
      <>
        <IconSprite />
        <Banner tone="need" title="Retake the tag photo" actions={<button type="button">Retake</button>}>
          Hold the tag flat.
        </Banner>
        <Banner tone="alert" strong title="Flood warning" role="status" />
      </>,
    );
    const first = container.querySelectorAll(".banner")[0]!;
    expect(first).toHaveClass("banner-need");
    expect(first.querySelector(".banner-text")).toHaveTextContent("Hold the tag flat.");
    expect(first.querySelector(".banner-actions button")).not.toBeNull();
    expect(first.querySelector('use[href="#i-alert"]')).not.toBeNull();
    const strong = container.querySelectorAll(".banner")[1]!;
    expect(strong).toHaveClass("banner-alert", "is-strong");
    expect(strong.querySelector('use[href="#i-rain-alert"]')).not.toBeNull();
    expect(strong.querySelector(".banner-text")).toBeNull();
  });

  it("EmptyState, Skeleton, ErrorState and CheckList", () => {
    const { container } = render(
      <>
        <IconSprite />
        <EmptyState title="No claims yet" action={<button type="button">See alert settings</button>}>
          If a flood hits a covered parcel, AiGRI drafts the claim for you.
        </EmptyState>
        <div aria-busy="true">
          <Skeleton height={20} width="60%" />
        </div>
        <ErrorState title="Readings didn't load" action={<button type="button">Try again</button>}>
          Your claim is not affected.
        </ErrorState>
        <CheckList
          items={[
            { tone: "ok", text: "All parcels inside the policy period." },
            { tone: "need", text: "Radar shows no flood." },
            { tone: "denied", text: "One photo has no GPS location." },
          ]}
        />
      </>,
    );
    expect(screen.getByRole("heading", { name: "No claims yet" })).toHaveClass("h-card");
    expect(container.querySelector(".skel")).toHaveStyle({ height: "20px", width: "60%" });
    expect(screen.getByRole("alert")).toHaveClass("error-state");
    const items = container.querySelectorAll(".check-list li");
    expect(items[0]).toHaveClass("is-ok");
    expect(items[1]).toHaveClass("is-need");
    expect(items[2]).toHaveClass("is-denied");
    expect(items[2]!.querySelector('use[href="#i-x"]')).not.toBeNull();
  });
});
