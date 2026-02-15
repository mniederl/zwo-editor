import { describe, expect, it } from "vitest";

import {
  calculateEstimatedTimes,
  getStressScore,
  getWorkoutDistance,
  getWorkoutLength,
  round,
  speedToPace,
} from "../src/domain/workout/metrics";
import { allBars, paced } from "./fixtures";

describe("workout math", () => {
  it("round: rounds to nearest", () => {
    expect(round(1234, 10)).toBe(1230);
    expect(round(1235, 10)).toBe(1240);
    expect(round(1234, 100)).toBe(1200);
    expect(round(1250, 100)).toBe(1300);
  });

  it("getWorkoutLength: time mode sums time directly", () => {
    const secs = getWorkoutLength(allBars, "time");
    // 300 + 600 + 0 + 900 = 1800
    expect(secs).toBe(1800);
  });

  it("getWorkoutLength: distance mode expands intervals", () => {
    const secs = getWorkoutLength(allBars, "distance");
    // bar(300) + trap(600) + interval(3*(60+30)=270) + freeRide(900)
    expect(secs).toBe(300 + 600 + 270 + 900);
  });

  it("getWorkoutDistance: km from meters", () => {
    const km = getWorkoutDistance(paced as any);
    // (4000 + 6000 + 3000)/1000
    expect(km).toBeCloseTo(13, 5);
  });

  it("getStressScore: returns numeric TSS", () => {
    const ftp = 250;
    const tss = getStressScore(allBars, ftp);
    expect(tss).toBeGreaterThan(0);
    expect(Number.isFinite(tss)).toBe(true);
  });

  it("calculateEstimatedTimes: fills missing via Riegel", () => {
    const distances = [5, 10, 21.0975];
    const times = ["00:25:00", null, undefined];
    const est = calculateEstimatedTimes(distances, times);
    expect(est[0]).toBe("00:25:00");
    expect(est[1]).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(est[2]).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("speedToPace: formats mm:ss", () => {
    expect(speedToPace(12, "metric")).toBe("05:00"); // 12 kph -> 5:00/km
    expect(speedToPace(12, "imperial")).toMatch(/^\d{2}:\d{2}$/);
  });

  it("speedToPace handles invalid speed", () => {
    expect(speedToPace(0, "metric")).toBe("00:00");
  });
});
