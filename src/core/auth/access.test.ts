import { expect, test } from "vitest";
import { AccessDeniedError, authorize, userFromCookie } from "./access";

test("unknown cookie values become the default user", () => {
  expect(userFromCookie("bob")).toBe("bob");
  expect(userFromCookie("mallory")).toBe("alice");
  expect(userFromCookie("__proto__")).toBe("alice");
  expect(userFromCookie(undefined)).toBe("alice");
});

test("each user reaches only their workspaces", () => {
  expect(authorize("alice", "langchain")).toBe("langchain");
  expect(authorize("bob", "cookbook")).toBe("cookbook");
  expect(() => authorize("bob", "langchain")).toThrow(AccessDeniedError);
  expect(() => authorize("bob", "uploads")).toThrow(AccessDeniedError);
  expect(() => authorize("alice", "../langchain")).toThrow(AccessDeniedError);
});
