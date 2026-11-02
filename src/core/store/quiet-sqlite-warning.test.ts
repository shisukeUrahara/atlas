import { expect, test } from "vitest";
import { isSqliteNotice } from "./quiet-sqlite-warning";

test("only the SQLite experimental notice is hidden", () => {
  const w = (name: string, message: string) => Object.assign(new Error(message), { name });
  expect(isSqliteNotice(w("ExperimentalWarning", "SQLite is an experimental feature and might change at any time"))).toBe(true);
  expect(isSqliteNotice(w("ExperimentalWarning", "Fetch is experimental"))).toBe(false);
  expect(isSqliteNotice(w("DeprecationWarning", "SQLite something"))).toBe(false);
});
