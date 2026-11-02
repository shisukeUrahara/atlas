import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { UploadButton } from "./UploadButton";

afterEach(() => vi.unstubAllGlobals());

const pick = () => {
  const input = screen.getByLabelText("Choose a PDF or Markdown file");
  fireEvent.change(input, { target: { files: [new File(["# Notes"], "notes.md")] } });
};

test("shows the job result and refreshes the page", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ added: 2, removed: 0, unchanged: 0, jobId: "abcdef123456", indexVersion: 3 }, { status: 201 })));
  render(<UploadButton workspaceId="uploads" />);
  pick();
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("notes.md: +2 −0 =0 chunks, index v3"));
  expect(refresh).toHaveBeenCalled();
});

test("shows the server's error message", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { code: "no_text", message: "No text layer found." } }, { status: 422 })));
  render(<UploadButton workspaceId="uploads" />);
  pick();
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No text layer found."));
});
