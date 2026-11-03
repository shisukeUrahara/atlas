import { expect, test } from "@playwright/test";

test("Retrieval Lab: a labeled question shows three columns and its expected chunk", async ({ page }) => {
  await page.goto("/lab?ws=langchain");
  await page.getByRole("button", { name: /^paraphrase/ }).first().click();
  await expect(page.getByRole("region", { name: "BM25 results" }).getByText(/^#1(\D|$)/)).toBeVisible();
  // the question's embedding is in the committed cache, so dense runs with no key
  await expect(page.getByRole("region", { name: "Dense results" }).getByText(/^#1(\D|$)/)).toBeVisible();
  await expect(page.getByText("expected", { exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/q=/);
});

test("Retrieval Lab: a new question in replay mode says dense needs a key", async ({ page }) => {
  await page.goto("/lab?ws=langchain&q=zz%20uncached%20question%20about%20checkpointers");
  await expect(page.getByRole("region", { name: "Dense results" })).toContainText("OPENAI_API_KEY");
});

test("Evaluation shows the committed holdout runs with the label status", async ({ page }) => {
  await page.goto("/evaluation");
  await expect(page.getByText("Recall@5 · hybrid")).toBeVisible();
  await expect(page.getByRole("note")).toContainText("pending owner review");
  await expect(page.getByText("Failures only")).toBeVisible();
});

test("Ask without an API key shows the replay-mode state", async ({ page }) => {
  await page.goto("/ask?ws=langchain");
  await page.getByLabel(/Ask the/).fill("How do I add short-term memory to an agent?");
  await page.getByRole("button", { name: /^Ask/ }).click();
  // Next.js adds an empty route-announcer alert; pick ours by its text.
  await expect(page.getByRole("alert").filter({ hasText: "No API key: replay mode" })).toBeVisible();
});

test("Sources: real documents and the update diff", async ({ page }) => {
  await page.goto("/sources?ws=langchain");
  await expect(page.getByText("Added 1,226 chunks")).toBeVisible();
  await expect(page.getByText("src/oss/langchain/agents.mdx")).toBeVisible();
});

test("bob sees a denied state for LangChain and the switch changes access", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "atlas_user", value: "bob", url: baseURL! }]);
  await page.goto("/sources?ws=langchain");
  await expect(page.getByRole("alert").filter({ hasText: "No access" })).toBeVisible();
  await page.getByRole("combobox").first().selectOption("alice");
  await page.goto("/sources?ws=langchain");
  await expect(page.getByText("src/oss/langchain/agents.mdx")).toBeVisible();
});

test("upload in My uploads updates the table", async ({ page }, info) => {
  // Each width uploads its own file: all three share one test database.
  const name = `e2e-notes-${info.project.name}.md`;
  await page.goto("/sources?ws=uploads");
  await page.setInputFiles("input[type=file]", {
    name,
    mimeType: "text/markdown",
    buffer: Buffer.from(`# E2E notes\n\n## Backoff\n\nRetry with exponential backoff and jitter after a 429 (${Date.now()}).\n`),
  });
  await expect(page.getByRole("status")).toContainText(`${name}: +1`);
  await expect(page.getByRole("cell", { name: new RegExp(name.replace(".", "\\.")) })).toBeVisible();
});

test("Ask: a long recent question never widens the page (phone regression)", async ({ page, request }) => {
  // Leave a long question in the history first (replay mode: it is traced only if answered, so post
  // a labeled holdout question whose answer is in the committed response cache).
  const long = "How do I create a function to find and handle sensitive information in text with options like blocking, redacting, masking, or hashing?";
  await request.post("/api/answer", { data: { workspaceId: "langchain", question: long } });
  await page.goto("/ask?ws=langchain");
  const [content, screen] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(content).toBeLessThanOrEqual(screen);
  await expect(page.getByRole("button", { name: /^Ask/ })).toBeInViewport();
});
