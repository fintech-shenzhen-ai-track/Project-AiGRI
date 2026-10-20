import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink, IconButton } from "@/components/Button";
import { Affix, Field, Input, Select, Textarea } from "@/components/Field";
import { Choice, SelectGroup } from "@/components/Choice";
import { Chip, ChipGroup } from "@/components/Chip";
import { Check, Radio } from "@/components/Check";
import { Switch } from "@/components/Switch";
import { Seg } from "@/components/Seg";
import { Upload } from "@/components/Upload";
import { Otp } from "@/components/Otp";
import { IconSprite } from "@/components/icons/sprite";

describe("Button", () => {
  it("uses the design system classes for variant, size and block", () => {
    render(
      <>
        <Button variant="y" size="lg" block>
          Get covered
        </Button>
        <Button>Plain</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Get covered" })).toHaveClass("btn", "btn-y", "btn-lg", "btn-block");
    expect(screen.getByRole("button", { name: "Plain" })).toHaveClass("btn", "btn-ink");
    expect(screen.getByRole("button", { name: "Plain" })).not.toHaveClass("btn-md");
  });

  it("is type=button by default and ignores clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Go</Button>
        <Button loading onClick={onClick}>
          Pay
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "button");
    const loading = screen.getByRole("button", { name: "Pay" });
    expect(loading).toHaveClass("is-loading");
    expect(loading).toHaveAttribute("aria-busy", "true");
    await userEvent.click(loading);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders an icon button with an accessible name and an optional dot", () => {
    const { container } = render(
      <>
        <IconSprite />
        <IconButton icon="bell" label="Alerts, 1 new" dot />
        <ButtonLink href="/client/home" variant="soft">
          Home
        </ButtonLink>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Alerts, 1 new" });
    expect(btn).toHaveClass("icon-btn");
    expect(btn.querySelector(".dot")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("btn", "btn-soft");
    expect(container.querySelector('svg.i use[href="#i-bell"]')).not.toBeNull();
  });
});

describe("Field", () => {
  it("links label, hint and error to the control and marks it invalid", () => {
    render(
      <Field label="Business ID (NIB)" hint="As on your NIB." error="NIB has 13 digits.">
        <Input defaultValue="12345" />
      </Field>,
    );
    const input = screen.getByLabelText("Business ID (NIB)");
    expect(input).toHaveClass("input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const described = (input.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described).toHaveLength(2);
    expect(document.getElementById(described[0]!)).toHaveTextContent("As on your NIB.");
    expect(document.getElementById(described[1]!)).toHaveTextContent("NIB has 13 digits.");
  });

  it("works without a Field, and wraps select and textarea", () => {
    render(
      <>
        <Select aria-label="Regency">
          <option>Demak</option>
        </Select>
        <Textarea aria-label="Notes" />
        <Affix suffix="unit">
          <Input aria-label="Area" />
        </Affix>
      </>,
    );
    expect(screen.getByLabelText("Regency").parentElement).toHaveClass("select-wrap");
    expect(screen.getByLabelText("Regency")).toHaveClass("select");
    expect(screen.getByLabelText("Notes")).toHaveClass("textarea");
    expect(screen.getByLabelText("Area").parentElement).toHaveClass("affix");
    expect(screen.getByText("unit")).toHaveClass("affix-suf");
  });
});

describe("Choice and Chip groups", () => {
  it("single select moves the selection and reports the value", async () => {
    const onValueChange = vi.fn();
    render(
      <SelectGroup defaultValue="biz" onValueChange={onValueChange}>
        <Choice value="biz" title="Agri business" />
        <Choice value="ind" title="Individual farmer" />
      </SelectGroup>,
    );
    const biz = screen.getByRole("button", { name: "Agri business" });
    const ind = screen.getByRole("button", { name: "Individual farmer" });
    expect(biz).toHaveClass("is-sel");
    expect(biz).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(ind);
    expect(ind).toHaveClass("is-sel");
    expect(biz).not.toHaveClass("is-sel");
    expect(biz).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenCalledWith("ind");
  });

  it("multiple select toggles chips independently", async () => {
    const onValueChange = vi.fn();
    render(
      <ChipGroup multiple defaultValue={["flood"]} onValueChange={onValueChange}>
        <Chip value="flood">Flood</Chip>
        <Chip value="drought">Drought</Chip>
      </ChipGroup>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Drought" }));
    expect(screen.getByRole("button", { name: "Flood" })).toHaveClass("is-sel");
    expect(screen.getByRole("button", { name: "Drought" })).toHaveClass("is-sel");
    expect(onValueChange).toHaveBeenLastCalledWith(["flood", "drought"]);
    await userEvent.click(screen.getByRole("button", { name: "Flood" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["drought"]);
  });

  it("a controlled group follows its value", () => {
    const { rerender } = render(
      <SelectGroup value="a">
        <Choice value="a" title="A" />
        <Choice value="b" title="B" />
      </SelectGroup>,
    );
    expect(screen.getByRole("button", { name: "A" })).toHaveClass("is-sel");
    rerender(
      <SelectGroup value="b">
        <Choice value="a" title="A" />
        <Choice value="b" title="B" />
      </SelectGroup>,
    );
    expect(screen.getByRole("button", { name: "B" })).toHaveClass("is-sel");
  });
});

describe("Check, Radio, Switch", () => {
  it("renders native inputs inside the design system boxes", async () => {
    render(
      <>
        <Check defaultChecked>I agree</Check>
        <Radio name="r" defaultChecked>
          Wallet
        </Radio>
        <Switch aria-label="Push alerts" defaultChecked />
        <Switch>SMS alerts</Switch>
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "I agree" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Wallet" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Push alerts" })).toBeChecked();
    const sms = screen.getByRole("switch", { name: "SMS alerts" });
    expect(sms).not.toBeChecked();
    await userEvent.click(sms);
    expect(sms).toBeChecked();
  });
});

describe("Seg", () => {
  it("selects an option and reports it", async () => {
    const onValueChange = vi.fn();
    function Demo() {
      const [v, setV] = useState("season");
      return (
        <Seg
          aria-label="Range"
          value={v}
          onValueChange={(x) => {
            setV(x);
            onValueChange(x);
          }}
          options={[
            { value: "season", label: "This season" },
            { value: "16d", label: "Next 16 days" },
          ]}
        />
      );
    }
    render(<Demo />);
    expect(screen.getByRole("button", { name: "This season" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Next 16 days" }));
    expect(screen.getByRole("button", { name: "Next 16 days" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "This season" })).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenCalledWith("16d");
    expect(screen.getByRole("group", { name: "Range" })).toHaveClass("seg", "has-thumb");
  });
});

describe("Upload", () => {
  it("passes chosen and dropped files on, and shows progress", () => {
    const onFiles = vi.fn();
    const { container, rerender } = render(<Upload title="Add photos" hint="JPG or PNG." onFiles={onFiles} multiple />);
    const input = screen.getByLabelText("Add photos") as HTMLInputElement;
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);

    const zone = container.querySelector(".upload") as HTMLElement;
    fireEvent.dragEnter(zone);
    expect(zone).toHaveClass("is-over");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(zone).not.toHaveClass("is-over");
    expect(onFiles).toHaveBeenCalledTimes(2);

    rerender(<Upload title="IMG_2041.jpg" progress={0.62} progressText="62%" />);
    expect(container.querySelector(".meter > span")).toHaveStyle({ "--p": "0.62" });
    expect(screen.getByText("62%")).toBeInTheDocument();
  });
});

describe("Otp", () => {
  it("moves between boxes, accepts a pasted code and reports completion", async () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<Otp onChange={onChange} onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(boxes).toHaveLength(6);
    await userEvent.type(boxes[0]!, "48");
    expect(boxes[0]!.value).toBe("4");
    expect(boxes[1]!.value).toBe("8");
    expect(boxes[2]).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith("48");

    await userEvent.click(boxes[3]!);
    await userEvent.paste("123456");
    expect(boxes.map((b) => b.value).join("")).toBe("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");

    await userEvent.keyboard("{Backspace}");
    expect(boxes.map((b) => b.value).join("")).toBe("12345");
  });

  it("ignores letters", async () => {
    render(<Otp />);
    const boxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    await userEvent.type(boxes[0]!, "a");
    expect(boxes[0]!.value).toBe("");
  });
});
