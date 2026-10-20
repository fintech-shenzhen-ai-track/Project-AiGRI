import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SignInPage from "@/app/sign-in/page";

describe("placeholder sign-in page", () => {
  it("renders a main landmark with a heading", () => {
    render(<SignInPage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});
