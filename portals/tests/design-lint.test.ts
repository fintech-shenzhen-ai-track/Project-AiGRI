import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const script = path.resolve(import.meta.dirname, "../scripts/design-lint.mjs");
const dir = mkdtempSync(path.join(os.tmpdir(), "design-lint-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function lint(name: string, content: string) {
  const file = path.join(dir, name);
  writeFileSync(file, content);
  const res = spawnSync(process.execPath, [script, file], { encoding: "utf8" });
  return { status: res.status, out: `${res.stdout}${res.stderr}` };
}

describe("design lint", () => {
  it("accepts clean CSS, including border:0, border-radius and the focus ring", () => {
    const r = lint("ok.css", ".a{border:0;border-radius:8px;transition:opacity 200ms var(--ease-out)} :focus-visible{outline:3px solid #000;outline-offset:3px} .b{transition-timing-function:cubic-bezier(.77,0,.18,1)} .c{--e:ease-in-out}");
    expect(r.out).toContain("ok");
    expect(r.status).toBe(0);
  });

  it.each([
    ["viewport unit", ".a{height:100vh}", "viewport units"],
    ["border", ".a{border:1px solid red}", "border:"],
    ["border-top", ".a{border-top:1px solid red}", "border-top:"],
    ["outline", ".a:hover{outline:2px solid red}", "outline:"],
    ["dashed", ".a{text-decoration:underline dashed}", "dashed"],
    ["backdrop-filter", ".a{backdrop-filter:blur(4px)}", "backdrop-filter"],
    ["ease-in alone", ".a{transition:opacity 1s ease-in}", "ease-in alone"],
    ["scale(0)", ".a{transform:scale(0)}", "scale(0)"],
    ["transition: all", ".a{transition:all 1s}", "transition: all"],
  ])("rejects %s in CSS", (_name, css, expected) => {
    const r = lint("bad.css", css);
    expect(r.status).toBe(1);
    expect(r.out).toContain(expected);
  });

  it.each(["Rp", "PHP", "IDR", "WIB", "OJK", "BI-FAST"])("rejects the literal %s in component code", (lit) => {
    const r = lint("bad.tsx", `export const X = () => <p>Total ${lit} 5</p>;`);
    expect(r.status).toBe(1);
    expect(r.out).toContain(`literal "${lit}"`);
  });

  it("rejects ' ha' but not words that start with ha", () => {
    expect(lint("ha.tsx", 'export const a = "48 ha";').status).toBe(1);
    expect(lint("has.tsx", 'export const a = "she has it, a harvest";').status).toBe(0);
  });

  it.each(["AiGRI approved", "auto-approved", "AI decided"])("rejects the phrase %s anywhere", (phrase) => {
    const r = lint("copy.tsx", `export const a = "Claim ${phrase}";`);
    expect(r.status).toBe(1);
    expect(r.out).toContain(phrase);
  });

  it("ignores banned literals inside comments", () => {
    expect(lint("comment.ts", "// the Rp symbol comes from the pack\nexport const a = 1;").status).toBe(0);
  });
});
