import { describe, it, expect } from "vitest";
import { categoryLabel, visibilityLabel } from "./constants";

describe("categoryLabel", () => {
  it("開発を返す", () => {
    expect(categoryLabel("development")).toBe("開発");
  });

  it("会議を返す", () => {
    expect(categoryLabel("meeting")).toBe("会議");
  });

  it("存在しない値はそのまま返す", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});

describe("visibilityLabel", () => {
  it("チーム内のみを返す", () => {
    expect(visibilityLabel("team")).toBe("チーム内のみ");
  });

  it("全体公開を返す", () => {
    expect(visibilityLabel("global")).toBe("全体公開");
  });

  it("存在しない値はそのまま返す", () => {
    expect(visibilityLabel("unknown")).toBe("unknown");
  });
});