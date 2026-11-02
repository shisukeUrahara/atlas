import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab", useRouter: () => ({ refresh: () => {} }) }));
import { isActive, Nav } from "./Nav";

test("marks the current page in both navs", () => {
  render(<Nav user="alice" />);
  const current = screen.getAllByRole("link", { current: "page" });
  expect(current.map((a) => a.textContent)).toEqual(["Retrieval Lab", "Lab"]);
  expect(screen.getByRole("combobox")).toHaveValue("alice");
});

test("Overview is only active on the home page", () => {
  expect(isActive("/", "/")).toBe(true);
  expect(isActive("/ask", "/")).toBe(false);
  expect(isActive("/sources/x", "/sources")).toBe(true);
});
