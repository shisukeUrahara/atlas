import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Captures the README images from a server that reads the REAL data folder (atlas.db, runs/, cache/):
//   pnpm build && PORT=3200 pnpm start &
//   E2E_SHOTS=1 E2E_BASE_URL=http://localhost:3200 pnpm exec playwright test e2e/screenshots.spec.ts --project desktop --project mobile
// The Ask image uses a holdout question, so its answer replays from cache/responses (no new API call).
test.skip(!process.env.E2E_SHOTS, "set E2E_SHOTS=1 to capture README images");

const question = (id: string) =>
  readFileSync("fixtures/eval/questions.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).find((q) => q.id === id).question as string;

async function ask(page: Page, q: string) {
  await page.goto("/ask?ws=langchain");
  await page.getByLabel(/Ask the/).fill(q);
  await page.getByRole("button", { name: /^Ask/ }).click();
  await expect(page.getByText(/claims cited/)).toBeVisible({ timeout: 30_000 });
}

test("desktop images", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await page.screenshot({ path: "docs/img/overview-dark.png" });
  await ask(page, question("q025"));
  await page.screenshot({ path: "docs/img/ask-dark.png" });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.screenshot({ path: "docs/img/ask-light.png" });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto(`/lab?ws=langchain&q=${encodeURIComponent(question("q055"))}`);
  await page.screenshot({ path: "docs/img/lab-dark.png" });
  await page.goto("/evaluation");
  await page.screenshot({ path: "docs/img/evaluation-dark.png", fullPage: true });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/sources?ws=langchain");
  await page.screenshot({ path: "docs/img/sources-light.png" });
});

test("phone images", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await ask(page, question("q025"));
  await page.getByRole("button", { name: "Show evidence c1" }).first().click();
  await page.screenshot({ path: "docs/img/ask-phone.png" });
});
