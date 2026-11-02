import { describe, expect, test } from "vitest";
import { loadEnv } from "./env";

describe("loadEnv", () => {
  test("no key means replay mode with defaults", () => {
    expect(loadEnv({}, "/work")).toEqual({
      mode: "replay",
      apiKey: null,
      dataDir: "/work",
      qdrantUrl: null,
      model: "gpt-4.1-mini-2025-04-14",
      embedModel: "text-embedding-3-small",
    });
    expect(loadEnv({ OPENAI_API_KEY: "  " }).mode).toBe("replay");
  });
  test("a key means live mode", () => {
    expect(loadEnv({ OPENAI_API_KEY: "sk-x" })).toMatchObject({ mode: "live", apiKey: "sk-x" });
  });
  test("ATLAS_DATA_DIR overrides the folder", () => {
    expect(loadEnv({ ATLAS_DATA_DIR: "/data" }, "/work").dataDir).toBe("/data");
  });
  test("ATLAS_QDRANT_URL must be a URL", () => {
    expect(loadEnv({ ATLAS_QDRANT_URL: "http://qdrant:6333" }).qdrantUrl).toBe("http://qdrant:6333");
    expect(() => loadEnv({ ATLAS_QDRANT_URL: "not a url" })).toThrow(/ATLAS_QDRANT_URL/);
    // .env.example ships it empty: that must mean "use the in-process store", not an error
    expect(loadEnv({ ATLAS_QDRANT_URL: "" }).qdrantUrl).toBeNull();
    expect(loadEnv({ ATLAS_QDRANT_URL: "  " }).qdrantUrl).toBeNull();
  });
  test("ATLAS_MODEL picks the answer model", () => {
    expect(loadEnv({ ATLAS_MODEL: "gpt-4o-mini-2024-07-18" }).model).toBe("gpt-4o-mini-2024-07-18");
    expect(loadEnv({ ATLAS_MODEL: " " }).model).toBe("gpt-4.1-mini-2025-04-14");
  });
});
