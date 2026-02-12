import { describe, expect, it } from "vitest";

import { parseLine, parseLines } from "../src/parsers/parseWorkoutLine";

describe("parseWorkoutLine", () => {
  it("parses a steady block with watts and duration", () => {
    expect(parseLine("steady 120w 30s")).toEqual({
      t: "steady",
      power: { unit: "w", value: 120 },
      time: 30,
      cad: undefined,
    });
  });

  it("parses a ramp block", () => {
    expect(parseLine("ramp 120w-140w 1m")).toEqual({
      t: "ramp",
      power: {
        a: { unit: "w", value: 120 },
        b: { unit: "w", value: 140 },
      },
      time: 60,
      cad: undefined,
    });
  });

  it("accepts warmup/cooldown aliases for ramp blocks", () => {
    expect(parseLine("warmup 120w-140w 1m")).toEqual({
      t: "warmup",
      power: {
        a: { unit: "w", value: 120 },
        b: { unit: "w", value: 140 },
      },
      time: 60,
      cad: undefined,
    });

    expect(parseLine("cooldown 140w-100w 1m")).toEqual({
      t: "cooldown",
      power: {
        a: { unit: "w", value: 140 },
        b: { unit: "w", value: 100 },
      },
      time: 60,
      cad: undefined,
    });
  });

  it("accepts single-quoted messages", () => {
    expect(parseLine("message 'Stay steady' 10s")).toEqual({
      t: "message",
      text: "Stay steady",
      time: 10,
    });
  });

  it("accepts empty quoted message payload", () => {
    expect(parseLine('message "" 10s')).toEqual({
      t: "message",
      text: "",
      time: 10,
    });
  });

  it("ignores blank lines in parseLines", () => {
    expect(parseLines(["steady 120w 30s", "", "message \"x\" 5s"])).toEqual([
      {
        t: "steady",
        power: { unit: "w", value: 120 },
        time: 30,
        cad: undefined,
      },
      {
        t: "message",
        text: "x",
        time: 5,
      },
    ]);
  });

  it("uses interval default reps = 3 (parity with parseWorkoutText)", () => {
    expect(parseLine("interval 30s-60s 200w-100w")).toEqual({
      t: "interval",
      reps: 3,
      time: { a: 30, b: 60 },
      power: {
        a: { unit: "w", value: 200 },
        b: { unit: "w", value: 100 },
      },
      cad: undefined,
    });
  });

  it("rejects malformed tokens clearly", () => {
    expect(() => parseLine("steady w 30s")).toThrow();
    expect(() => parseLine("steady 120w s")).toThrow();
    expect(() => parseLine("interval x 30s-30s 100w-80w")).toThrow();
    expect(() => parseLine('message "Unclosed 10s')).toThrow();
  });
});
