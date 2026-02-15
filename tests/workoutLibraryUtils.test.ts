import { describe, expect, it } from "vitest";

import {
  getUniqueWorkoutFileName,
  normalizeWorkoutFileName,
  stripWorkoutFileExtension,
} from "@/components/Editor/workoutLibraryUtils";

describe("workout library utils", () => {
  it("normalizes names to .zwo", () => {
    expect(normalizeWorkoutFileName("tempo")).toBe("tempo.zwo");
    expect(normalizeWorkoutFileName("tempo.zwo")).toBe("tempo.zwo");
  });

  it("strips supported extensions", () => {
    expect(stripWorkoutFileExtension("tempo.zwo")).toBe("tempo");
    expect(stripWorkoutFileExtension("tempo.xml")).toBe("tempo");
    expect(stripWorkoutFileExtension("tempo")).toBe("tempo");
  });

  it("generates unique copy names when needed", () => {
    const existing = ["tempo.zwo", "tempo copy.zwo", "tempo copy 2.zwo"];
    expect(getUniqueWorkoutFileName("tempo", existing)).toBe("tempo copy 3.zwo");
  });
});
