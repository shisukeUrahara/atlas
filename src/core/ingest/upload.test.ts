import { beforeEach, describe, expect, test } from "vitest";
import { Store } from "../store/sqlite";
import { buildUpload, ingestUpload, MAX_UPLOAD_BYTES, safeFileName, UploadError } from "./upload";

const enc = (s: string) => new TextEncoder().encode(s);
const md = "# Notes\n\n## Checkpointers\n\nA checkpointer saves graph state after every step of the run.\n";

describe("safeFileName", () => {
  test("keeps only a safe base name", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\docs\\my notes.md")).toBe("my_notes.md");
    expect(safeFileName(".hidden.md")).toBe("hidden.md");
  });
  test("refuses empty names", () => {
    expect(() => safeFileName("../")).toThrow(UploadError);
  });
});

describe("buildUpload", () => {
  test("Markdown becomes chunks with an upload: url", async () => {
    const doc = await buildUpload("uploads", "notes.md", enc(md));
    expect(doc.title).toBe("Notes");
    expect(doc.chunks[0]).toMatchObject({ heading: "Checkpointers", url: "upload:notes.md", workspaceId: "uploads" });
  });
  test.each([
    ["too big", "a.md", new Uint8Array(MAX_UPLOAD_BYTES + 1), "too_large"],
    ["wrong type", "a.exe", enc("MZ"), "bad_type"],
    ["fake pdf", "a.pdf", enc("hello"), "bad_type"],
    ["not utf-8", "a.md", new Uint8Array([0xff, 0xfe, 0xfd]), "not_utf8"],
  ])("rejects %s", async (_label, name, bytes, code) => {
    await expect(buildUpload("uploads", name, bytes)).rejects.toMatchObject({ code });
  });
});

describe("ingestUpload", () => {
  let store: Store;
  beforeEach(() => {
    store = new Store();
    store.upsertWorkspace({ id: "uploads", name: "My uploads", source: "upload", license: "user upload" });
  });
  test("ingests into the workspace and a repeat upload is a no-op", async () => {
    const first = await ingestUpload(store, "uploads", "notes.md", enc(md));
    expect(first).toMatchObject({ added: 1, indexVersion: 1 });
    expect(store.job("uploads", first.jobId)?.status).toBe("done");
    const again = await ingestUpload(store, "uploads", "notes.md", enc(md));
    expect(again).toMatchObject({ added: 0, removed: 0, indexVersion: 1 });
  });
  test("unknown workspace is refused", async () => {
    await expect(ingestUpload(store, "nope", "notes.md", enc(md))).rejects.toMatchObject({ code: "unknown_workspace" });
  });
});
