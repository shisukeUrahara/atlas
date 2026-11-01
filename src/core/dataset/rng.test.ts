import { expect, test } from "vitest";
import { mulberry32, shuffle } from "./rng";

test("same seed gives the same sequence", () => {
  const a = mulberry32(7);
  const b = mulberry32(7);
  expect([a(), a(), a()]).toEqual([b(), b(), b()]);
});

test("shuffle keeps every item and does not mutate", () => {
  const items = [1, 2, 3, 4, 5];
  const out = shuffle(items, mulberry32(1));
  expect([...out].sort()).toEqual(items);
  expect(items).toEqual([1, 2, 3, 4, 5]);
});
