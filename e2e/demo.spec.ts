import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Records the demo video from a server that reads the REAL data folder:
//   pnpm build && PORT=3200 pnpm start &
//   E2E_DEMO=1 E2E_BASE_URL=http://localhost:3200 pnpm exec playwright test e2e/demo.spec.ts --project desktop
// Uses holdout questions, so every answer replays from cache/responses. The video lands in test-results/.
test.skip(!process.env.E2E_DEMO, "set E2E_DEMO=1 to record the demo video");
test.use({ viewport: { width: 1440, height: 900 }, video: { mode: "on", size: { width: 1440, height: 900 } } });

const questions = readFileSync("fixtures/eval/questions.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const q = (id: string) => questions.find((x: { id: string }) => x.id === id).question as string;

test("demo: overview, a cited answer, an abstention, the lab, sources, evaluation", async ({ page }) => {
  test.setTimeout(180_000);
  const scroll = async (px: number) => {
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, px / 12);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(900);
  };
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.waitForTimeout(3000);
  await scroll(500);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Ask" }).click();
  await page.getByLabel(/Ask the/).pressSequentially(q("q025"), { delay: 18 });
  await page.getByRole("button", { name: /^Ask/ }).click();
  await expect(page.getByText(/claims cited/)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const chips = page.getByRole("button", { name: /^Show evidence/ });
  if ((await chips.count()) > 1) await chips.nth(1).click();
  await page.waitForTimeout(2500);
  await page.getByLabel(/Ask the/).pressSequentially(q("q073"), { delay: 18 });
  await page.getByRole("button", { name: /^Ask/ }).click();
  await expect(page.getByText("Not enough evidence").last()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3000);
  await page.goto(`/lab?ws=langchain&q=${encodeURIComponent(q("q055"))}`);
  await page.waitForTimeout(4000);
  await page.goto("/sources?ws=langchain");
  await page.waitForTimeout(3000);
  await page.goto("/evaluation");
  await page.waitForTimeout(2500);
  await scroll(700);
  await scroll(700);
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.waitForTimeout(2000);
});
